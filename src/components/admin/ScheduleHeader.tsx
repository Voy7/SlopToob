export default function ScheduleHeader() {
  return (
    <div className="text-bold flex w-full cursor-default items-center gap-2 bg-bg2 px-2 py-2 text-base">
      <h2 className="w-10 shrink-0 text-center">Active</h2>
      <h2 className="w-[250px] shrink-0 text-center">Selected Playlist</h2>
      <h2 className="w-[140px] shrink-0 text-center">Week Day</h2>
      <h2 className="w-14 shrink-0 text-center">HH</h2>
      <span className="tshrink-0 ext-bold w-1 cursor-default text-center text-xl text-text3">
        :
      </span>
      <h2 className="w-14 shrink-0 text-center">MM</h2>
    </div>
  )
}
