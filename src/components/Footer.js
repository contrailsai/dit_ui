import Link from "next/link";

const Footer = () => {
    return (
        <div className="bg-white flex gap-3 py-2.5 justify-center items-center border-t border-slate-200 text-sm text-slate-500">
            <Link href="https://contrails.ai" target="_blank" className="hover:text-primary hover:underline transition-colors">
                Contrails AI
            </Link>
            <span className="text-slate-300">·</span>
            <span>©{new Date().getFullYear()}</span>
        </div>
    )
}

export default Footer
