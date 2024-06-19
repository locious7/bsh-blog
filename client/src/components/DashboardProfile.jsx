import { useRef } from "react";
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
} from "../redux/user/userSlice";
import { useDispatch } from "react-redux";
import { HiOutlineExclamationCircle } from "react-icons/hi";

export default function DashboardProfile() {
  const { currentUser, error } = useSelector((state) => state.user);
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
  const API_ENDPOINT = import.meta.env.VITE_PUBLIC_AWS_API_ENDPOINT;
  const dispatch = useDispatch();

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
      setImageFileUrl(URL.createObjectURL(file));

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

      // Handle upload directly after file is selected
      try {
        const { presignedUrl, s3ObjectUrl } = await getPresignedUrl(
          file
        );
        await uploadImage(presignedUrl, file);
        // setUploadUrl(s3ObjectUrl);
        setImageFileUrl(s3ObjectUrl);
        setFormData({ ...formData, profilePicture: s3ObjectUrl });
        setImageFileUploading(false);

        // setTimeout(() => {
        //   setImageFileUploadProgress(null);
        // }, 5000);
      } catch (error) {
        setImageFileUploadError(
          "Error during upload: " + error.message
        );
      }
    }
  };

  const getPresignedUrl = async (file) => {
    const filename = new Date().getTime() + "_" + file.name;
    const maxSizeInMB = 2;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    try {
      const response = await axios({
        method: "GET",
        url: API_ENDPOINT,
        params: {
          filename: filename,
          contentType: file.type,
          maxSize: maxSizeInBytes,
        },
      });
      const presignedUrl = response.data.presignedUrl;
      const s3ObjectUrl = response.data.s3ObjectUrl;
      // setImageFileUrl(s3ObjectUrl);
      // setFormData({ ...formData, profilePicture: s3ObjectUrl });
      return { presignedUrl, s3ObjectUrl };
      // return response.data.url;
    } catch (error) {
      setImageFileUploadError(
        "Error getting presigned URL: " + error.message
      );
      throw error;
    }
  };

  const uploadImage = async (presignedUrl, file) => {
    setImageFileUploadError(null);
    try {
      await axios.put(presignedUrl, file, {
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
      // setImageFile(null);
      setImageFileUrl(null);
      setImageFileUploadProgress(null);
      setImageFileUploading(false);
    }
  };

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
            className={`rounded-full w-full h-full object-cover border-8 border-[lightgray] ${imageFileUploadProgress &&
              imageFileUploadProgress < 100 &&
              "opacity-50"
              }`}
          />
          {imageFileUploadProgress && (
            <CircularProgressbar
              value={imageFileUploadProgress || 0}
              text={`${imageFileUploadProgress}%`}
              strokeWidth={5}
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
        <Button type="submit" gradientDuoTone="purpleToBlue" outline>
          Update
        </Button>
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
