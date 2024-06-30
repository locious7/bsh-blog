import { useRef, useCallback } from "react";
import { Alert, Button, Modal, TextInput } from "flowbite-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  updateStart,
  updateSuccess,
  updateFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signoutSuccess,
  setProfileImageUrl,
} from "../redux/user/userSlice";
import { useDispatch } from "react-redux";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { Link } from "react-router-dom";

export default function DashboardProfile() {
  const { currentUser, error, loading } = useSelector((state) => state.user);
  // const [imageFile, setImageFile] = useState(null);
  const [imageFileUrl, setImageFileUrl] = useState(null);
  const filePickerRef = useRef(null);
  const [imageFileUploadProgress, setImageFileUploadProgress] = useState(0);
  const [imageFileUploadError, setImageFileUploadError] = useState(null);
  // const [uploadUrl, setUploadUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [imageFileUploading, setImageFileUploading] = useState(false);
  const [updateUserSuccess, setUpdateUserSuccess] = useState(null);
  const [updateUserError, setUpdateUserError] = useState(null);
  const API_ENDPOINT = import.meta.env.VITE_PUBLIC_PROFILE_IMAGES_AWS_API_ENDPOINT;
  const dispatch = useDispatch();

  const getPresignedUrl = useCallback(async (key, file = null, isUpload = false) => {
    try {
      const params = {
        filename: key,
      };
      if (isUpload && file) {
        params.contentType = file.type;
      }

      const response = await axios.get(API_ENDPOINT, { params });

      if (!isUpload) {
        setImageFileUrl(response.data.presignedGetUrl);
        dispatch(setProfileImageUrl(response.data.presignedGetUrl));

      }
      return response.data;
    } catch (error) {
      console.error(`Error getting presigned URL:`, error);
      throw error;
    }
  }, [API_ENDPOINT, dispatch]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    const maxSizeInMB = 2;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    const acceptedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/apng",
      "image/avif",
    ];
    if (!acceptedImageTypes.includes(file.type)) {
      setImageFileUploadError("Only image files are allowed.");
      return;
    }
    if (file.size > maxSizeInBytes) {
      setImageFileUploadError(
        `File size exceeds the limit of ${maxSizeInMB} MB. Please select a smaller file.`
      );
      return;
    }

    if (file) {
      // setImageFile(file);
      // setImageFileUrl(URL.createObjectURL(file));

      // Track the initial load progress
      const reader = new FileReader();
      reader.onprogress = (data) => {
        if (data.lengthComputable) {
          const progress = Math.round(
            (data.loaded / data.total) * 100
          );
          setImageFileUploadProgress(progress);
        }
      };
      reader.onloadend = () => {
        setImageFileUploadProgress(100);
      };
      reader.readAsDataURL(file);

      try {
        setImageFileUploading(true);
        const filename = new Date().getTime() + "_" + file.name + "_" + `${currentUser._id}`;
        const { presignedPutUrl, presignedGetUrl } = await getPresignedUrl(filename, file, true);

        await uploadImage(presignedPutUrl, file);
        setImageFileUrl(presignedGetUrl);
        setFormData(prevData => ({...prevData, profilePicture: filename}));
        setImageFileUploading(false);
      } catch (error) {
        setImageFileUploadError("Error during upload: " + error.message);
        setImageFileUploading(false);
      }
    }
  }

  const uploadImage = async (presignedPutUrl, file) => {
    setImageFileUploadError(null);
    try {
      await axios.put(presignedPutUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setImageFileUploadProgress(percentCompleted);
        },
      });
    } catch (error) {
      setImageFileUploadError(`Error uploading file: ${error.message}`);
      setImageFileUploadProgress(null);
      setImageFileUploading(false);
      throw error;
    }
  };

  const handleImageError = useCallback(() => {
    // If the image fails to load, it might be due to an expired URL
    if (currentUser.profilePicture) {
      getPresignedUrl(currentUser.profilePicture);
    }
  }, [currentUser.profilePicture, getPresignedUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateUserError(null);
    setUpdateUserSuccess(null);
    if (Object.keys(formData).length === 0) {
      setUpdateUserError("No changes made");
      return;
    }
    if (imageFileUploading) {
      setUpdateUserError("Please wait for image to upload");
      return;
    }
    try {
      dispatch(updateStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(updateFailure(data.message));
        setUpdateUserError(data.message);
      } else {
        dispatch(updateSuccess(data));
        setUpdateUserSuccess("User's profile updated successfully");
        setImageFileUploadProgress(null);
      }
    } catch (error) {
      dispatch(updateFailure(error.message));
      setUpdateUserError(error.message);
    }
  };

  const handleDeleteUser = async () => {
    setShowModal(false);
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(deleteUserFailure(data.message));
      } else {
        dispatch(deleteUserSuccess(data));
      }
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

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
    <div className="max-w-sm mx-auto p-3 w-full">
      <h1 className="my-20 mb-4 text-center font-semibold text-3xl">
        Profile
      </h1>
      <aside className="mb-3 text-center mx-auto font-style: italic ">
        Click on the profile image to add a new one!
      </aside>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          ref={filePickerRef}
          hidden
        />
        <div
          className="relative w-48 h-48 self-center cursor-pointer shadow-md overflow-hidden rounded-full mb-4"
          onClick={() => filePickerRef.current.click()}
        >
          <img
            src={imageFileUrl || currentUser.profilePicture}
            alt="user"
            onError={handleImageError}
            className={`rounded-full w-full h-full object-cover border-4 border-[lightgray] ${imageFileUploadProgress &&
              imageFileUploadProgress < 100 &&
              "opacity-50"
              }`}
          />
          {imageFileUploadProgress && (
            <CircularProgressbar
              value={imageFileUploadProgress || 0}
              text={`${imageFileUploadProgress}%`}
              strokeWidth={4}
              styles={{
                root: {
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                },
                path: {
                  stroke: `rgba(62, 152, 199, ${imageFileUploadProgress / 100
                    })`,
                },
                text: {
                  // fill: "#54ab41",
                  fontSize: "26px",
                  fontWeight: "bold",
                },
              }}
            />
          )}
        </div>
        {imageFileUploadError && (
          <Alert color="failure">{imageFileUploadError}</Alert>
        )}
        <TextInput
          type="text"
          id="username"
          placeholder="Username"
          defaultValue={currentUser.username}
          onChange={handleChange}
        />
        <TextInput
          type="email"
          id="email"
          placeholder="email"
          defaultValue={currentUser.email}
          onChange={handleChange}
        />
        <TextInput
          type="password"
          id="password"
          placeholder="password"
          onChange={handleChange}
        />
        <Button
          type="submit"
          gradientDuoTone="purpleToBlue"
          outline
          disabled={loading || imageFileUploading}
        >
          {loading ? "Loading..." : "Update"}
        </Button>
        {currentUser.isAdmin && (
          <Link to={"/create-post"}>
            <Button
              type="button"
              gradientDuoTone="purpleToPink"
              className="w-full"
            >
              Create a post
            </Button>
          </Link>
        )}
      </form>
      <div className="text-red-500 flex justify-between mt-5">
        <span
          onClick={() => setShowModal(true)}
          className="cursor-pointer"
        >
          Delete Account
        </span>
        <span onClick={handleSignout} className="cursor-pointer">
          Sign Out
        </span>
      </div>
      {updateUserSuccess && (
        <Alert color="success" className="mt-5">
          {updateUserSuccess}
        </Alert>
      )}
      {updateUserError && (
        <Alert color="failure" className="mt-5">
          {updateUserError}
        </Alert>
      )}
      {error && (
        <Alert color="failure" className="mt-5">
          {error}
        </Alert>
      )}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        popup
        size="md"
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto" />
            <h3 className="mb-5 text-lg text-gray-500 dark:text-gray-400">
              Are you sure you want to delete your account? This
              cannot be undone!
            </h3>
            <div className="flex justify-center gap-8">
              <Button color="failure" onClick={handleDeleteUser}>
                Yes, I&apos;m sure
              </Button>
              <Button
                color="gray"
                onClick={() => setShowModal(false)}
              >
                No, Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
