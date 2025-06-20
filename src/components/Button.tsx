import clsx from 'clsx'
import Link from 'next/link'

const variantStyles = {
	primary:
		'bg-zinc-700 font-semibold text-zinc-100 hover:bg-zinc-600 active:bg-zinc-700 active:text-zinc-100/70',
	secondary:
		'bg-zinc-800/50 font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 active:bg-zinc-800/50 active:text-zinc-50/70',
}

type ButtonProps = {
	variant?: keyof typeof variantStyles
} & (
	| (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
	| React.ComponentPropsWithoutRef<typeof Link>
)

export function Button({
	className,
	variant = 'primary',
	...props
}: ButtonProps) {
	className = clsx(
		'inline-flex items-center gap-2 justify-center rounded-md py-2 px-3 text-sm outline-offset-2 transition active:transition-none',
		variantStyles[variant],
		className
	)

	return typeof props.href === 'undefined' ? (
		<button className={className} {...props} />
	) : (
		<Link className={className} {...props} />
	)
}
