import { useCallback, useEffect, useState } from "react";
import { Avatar, Button, Dropdown, Navbar, TextInput } from "flowbite-react";
import { Link, useLocation } from "react-router-dom";
import { AiOutlineSearch } from "react-icons/ai";
import { FaMoon, FaSun } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "../redux/theme/themeSlice";
import { signoutSuccess } from "../redux/user/userSlice";
import logo from "../assets/Beestingsandhoney.webp";
import axios from "axios";

export default function Header() {
  const path = useLocation().pathname;
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);
  // const profileImageUrl = useSelector((state) => state.user.profileImageUrl);
  const [imageFileUrl, setImageFileUrl] = useState(null);
  const API_ENDPOINT = import.meta.env.VITE_PUBLIC_PROFILE_IMAGES_AWS_API_ENDPOINT;

  // Assuming API_ENDPOINT and setImageFileUrl are defined elsewhere in your component
  const getPresignedUrl = useCallback(async (profileImageUrl) => {
    try {
      const params = { filename: profileImageUrl };
      const response = await axios.get(API_ENDPOINT, { params });
      setImageFileUrl(response.data.presignedGetUrl); // Update state with the fetched URL
      return response.data;
    } catch (error) {
      console.error(`Error getting presigned URL:`, error);
      throw error;
    }
  }, [API_ENDPOINT, setImageFileUrl]); // Add setImageFileUrl as a dependency

  // Adjusted useEffect hook
  useEffect(() => {
    if (currentUser && currentUser.profilePicture) {
      const fetchImage = async () => {
        try {
          await getPresignedUrl(currentUser.profilePicture);
        } catch (error) {
          console.error("Failed to fetch image:", error);
        }
      };

      fetchImage();
    }
  }, [currentUser, getPresignedUrl]); // Depend on currentUser and getPresignedUrl

  const handleSignout = async () => {
    try {
      const res = await fetch("/api/user/signout", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <Navbar className="border-b-2" fluid={true}>
      <Link
        to="/"
        className="self-center flex whitespace-nowrap text-sm sm:text-xl gap-2 font-semibold dark:text-white"
      >
        <img
          src={logo}
          alt="logo"
          className="w-8 sm:w-8 md:w-8 lg:w-8 xl:w-128"
        />
        <span className="px-2 py-1 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-lg text-white">
          Beestings and Honey
        </span>
      </Link>
      <form className="flex-grow hidden lg:flex lg:items-center lg:justify-center">
        <TextInput
          type="text"
          placeholder="Search"
          rightIcon={AiOutlineSearch}
          className="hidden lg:inline lg:w-1/2"
        />
      </form>
      <div className="flex gap-3 md:order-2 ml-5 mt-2 mb-2">
        <Button className="w-12 h-10 lg:hidden" color="gray" pill>
          <AiOutlineSearch size={20} />
        </Button>
        <Button
          className="w-12 h-10 justify-center"
          color="gray"
          pill
          onClick={() => dispatch(toggleTheme())}
        >
          {theme === "light" ? <FaMoon size={20} /> : <FaSun size={20} />}
        </Button>
        {currentUser ? (
          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Avatar alt="u" img={imageFileUrl || currentUser.profilePicture} rounded />
            }
          >
            <Dropdown.Header>
              <span className="block text-sm">@{currentUser.username}</span>
              <span className="block truncate text-sm font-medium">
                {currentUser.email}
              </span>
            </Dropdown.Header>
            <Link to={"/dashboard?tab=profile"}>
              <Dropdown.Item>Profile</Dropdown.Item>
            </Link>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleSignout}>Sign Out</Dropdown.Item>
          </Dropdown>
        ) : (
          <Link to="/sign-in">
            <Button gradientDuoTone="greenToBlue" outline>
              Sign In
            </Button>
          </Link>
        )}

        <Navbar.Toggle />
      </div>
      <Navbar.Collapse>
        <Navbar.Link active={path === "/"} as={"div"}>
          <Link to="/">Home</Link>
        </Navbar.Link>
        <Navbar.Link active={path === "/about"} as={"div"}>
          <Link to="/about">About</Link>
        </Navbar.Link>
        <Navbar.Link active={path === "/projects"} as={"div"}>
          <Link to="/projects">Projects</Link>
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}
