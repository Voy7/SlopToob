type Props = Exclude<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

export default function Checkbox(props: Props) {
  return (
    <input
      className="relative h-[1em] w-[1em] cursor-pointer appearance-none rounded border border-border1 checked:border-blue-500 checked:bg-blue-500 checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:block checked:after:h-4 checked:after:w-4 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:transform checked:after:text-center checked:after:leading-4 checked:after:text-text1 checked:after:content-['✔'] hover:border-blue-500 hover:border-opacity-50"
      type="checkbox"
      {...props}
    />
  )
}
