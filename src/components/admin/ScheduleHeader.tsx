export default function ScheduleHeader() {
  return (
    <div className="text-bold flex w-full cursor-default items-center gap-2 bg-bg3 px-2 py-2 text-base">
      <h2 className="w-10 text-center">Active</h2>
      <h2 className="w-[250px] text-center">Selected Playlist</h2>
      <h2 className="w-[140px] text-center">Week Day</h2>
      <h2 className="w-14 text-center">HH</h2>
      <span className="text-bold w-1 cursor-default text-center text-xl text-text3">:</span>
      <h2 className="w-14 text-center">MM</h2>
    </div>
  )
}
