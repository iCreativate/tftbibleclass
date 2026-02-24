 "use client";

export function AdminFooterButton() {
  function handleClick() {
    const event = new Event("tft-open-admin-modal");
    window.dispatchEvent(event);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hover:text-white"
    >
      Admin
    </button>
  );
}

