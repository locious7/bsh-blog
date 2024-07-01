import { Footer } from "flowbite-react"
import { Link } from "react-router-dom"
import logo from "../assets/Beestingsandhoney.webp"
import { BsInstagram, BsYoutube, BsFacebook, BsTwitter } from "react-icons/bs"

export default function FooterComp() {
    return (
        <Footer container className="border border-t-8 border-yellow-500 bg-gray-100 dark:bg-gray-900 dark:border-gray-700 ">
            <div className="w-full max-w-7xl mx-auto">
                <div className="grid w-full justify-between sm:flex md:grid-cols-1">
                    <div className="mt-5">
                        <Link
                            to="/"
                            className="self-center whitespace-nowrap text-2xl sm:text-xl font-semibold dark:text-white"
                        >
                            <span className="px-2 py-1 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-lg text-white">
                                Beestings and Honey
                            </span>
                            <img
                                src={logo}
                                alt="logo"
                                className="w-20 sm:w-20 md:w-32 lg:w-20 xl:w-128 mt-5"
                            />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-8 mt-4 sm:grid-cols-3 sm:gap-6">
                        <div>
                            <Footer.Title title="About" />
                            <Footer.LinkGroup col>
                                <Footer.Link
                                    href="/contact"
                                >
                                    Contact
                                </Footer.Link>
                                <Footer.Link
                                    href="/about"
                                >
                                    About BSH
                                </Footer.Link>
                            </Footer.LinkGroup>
                        </div>
                        <div>
                            <Footer.Title title="Follow US" />
                            <Footer.LinkGroup col>
                                <Footer.Link
                                    href="https://www.youtube.com/@beestingsandhoney1"
                                    target="_blank"
                                    rel="noopener noreferrrr"
                                >
                                    YouTube
                                </Footer.Link>
                                <Footer.Link
                                    href="https://www.instagram.com/"
                                    target="_blank"
                                    rel="noopener noreferrrr"
                                >
                                    Instagram
                                </Footer.Link>
                            </Footer.LinkGroup>
                        </div>
                        <div>
                            <Footer.Title title="Legal" />
                            <Footer.LinkGroup col>
                                <Footer.Link
                                    href="#"
                                >
                                    Privacy Policy
                                </Footer.Link>
                                <Footer.Link
                                    href="#"
                                >
                                    Terms and Conditions
                                </Footer.Link>
                            </Footer.LinkGroup>
                        </div>
                    </div>
                </div>
                <Footer.Divider className="mt-8" />
                <div className="w-full sm:flex sm:items-center sm:justify-between">
                    <Footer.Copyright href='#' by="Beestings and Honey" year={new Date().getFullYear()} />
                    <div className="flex gap-6 sm:mt-0 mt-4 sm:justify-center">
                        <Footer.Icon href="#" target="_blank" rel="noopener noreferrrr" icon={BsFacebook} />
                        <Footer.Icon href="#" target="_blank" rel="noopener noreferrrr" icon={BsInstagram} />
                        <Footer.Icon href="https://www.youtube.com/@beestingsandhoney1" target="_blank" rel="noopener noreferrrr" icon={BsYoutube} />
                    </div>
                </div>
            </div>
        </Footer>
    )
}