export function DiscordFloatingButton() {
  return (
    <a
      href="https://discord.com/invite/NFF9pWxCV5"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#5865F2] hover:bg-[#4752C4] rounded-full shadow-lg p-3 flex items-center justify-center transition-all duration-200 border-2 border-white/20"
      style={{ boxShadow: '0 4px 24px 0 #23272a55' }}
      aria-label="Join our Discord"
    >
      <img src="/discord.svg" alt="Discord" className="w-8 h-8" />
    </a>
  )
}