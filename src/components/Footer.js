import Link from "next/link";

const Footer = () => {
    return (
        <div className=' bg-white flex gap-3 py-1.5 justify-center items-center border-t border-primary '>
            <Link href={'https://www.techmahindra.com/'} target='_blank' className='hover:underline'>
                Tech Mahindra
            </Link>
            ©2025
        </div>
    )
}

export default Footer
