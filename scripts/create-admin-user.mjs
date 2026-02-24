#!/usr/bin/env node
/**
 * One-time script to create the admin user in Supabase.
 *
 * Requires:
 *   - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API)
 *   - NEXT_PUBLIC_SUPABASE_URL (already in .env.local)
 *   - ADMIN_PASSWORD (use the password from .admin-credentials.txt)
 *
 * Run from project root:
 *   node scripts/create-admin-user.mjs
 *
 * With env from .env.local (Bash):
 *   set -a && source .env.local && set +a && node scripts/create-admin-user.mjs
 *
 * Or pass explicitly:
 *   ADMIN_PASSWORD='your-generated-password' SUPABASE_SERVICE_ROLE_KEY='your-service-role-key' NEXT_PUBLIC_SUPABASE_URL='https://....supabase.co' node scripts/create-admin-user.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Load .env.local if present (simple parse, no dotenv dependency)
function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!serviceRoleKey && existsSync(resolve(root, ".env.local"))) {
  const raw = readFileSync(resolve(root, ".env.local"), "utf8");
  const hasKey = /SUPABASE_SERVICE_ROLE_KEY\s*=/.test(raw);
  if (hasKey) console.error("SUPABASE_SERVICE_ROLE_KEY is in .env.local but parsed as empty. Check that the value is on the same line (no line break in the middle).");
}

const ADMIN_EMAIL = "admin@tftbibleclass.co.za";

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL (e.g. in .env.local)");
  process.exit(1);
}
if (!serviceRoleKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local (from Supabase Dashboard → Settings → API → service_role secret)."
  );
  console.error(
    "Ensure the line is: SUPABASE_SERVICE_ROLE_KEY=your-key-here (no space around =, full value on one line)."
  );
  process.exit(1);
}
if (!adminPassword) {
  console.error(
    "Missing ADMIN_PASSWORD. Use the password from .admin-credentials.txt, or set env: ADMIN_PASSWORD='...'"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Creating admin user:", ADMIN_EMAIL);

  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: adminPassword,
    email_confirm: true,
  });

  if (userError) {
    if (userError.message?.includes("already been registered")) {
      console.log("Admin user already exists. Ensuring profile has role 'admin'...");
      const { data: existing } = await supabase.auth.admin.listUsers();
      const admin = existing?.users?.find((u) => u.email === ADMIN_EMAIL);
      if (admin) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          { id: admin.id, full_name: "Admin", role: "admin" },
          { onConflict: "id" }
        );
        if (profileError) {
          console.error("Profile update error:", profileError.message);
          process.exit(1);
        }
        console.log("Profile updated. You can sign in with the admin email and password.");
      }
      return;
    }
    console.error("Create user error:", userError.message);
    process.exit(1);
  }

  if (!user?.user?.id) {
    console.error("No user returned");
    process.exit(1);
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.user.id,
    full_name: "Admin",
    role: "admin",
  });

  if (profileError) {
    console.error("Profile insert error:", profileError.message);
    process.exit(1);
  }

  console.log("Admin user and profile created. Sign in at the app with:");
  console.log("  Email:", ADMIN_EMAIL);
  console.log("  Password: (the one from .admin-credentials.txt)");
  console.log("  Admin access code: (the one in .env.local as ADMIN_ACCESS_CODE)");
}

main();
