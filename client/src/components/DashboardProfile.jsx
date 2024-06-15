import { useCallback, useEffect, useRef } from "react";
import { Alert, Button, TextInput } from "flowbite-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function DashboardProfile() {
  const { currentUser } = useSelector((state) => state.user);
  const [imageFile, setImageFile] = useState(null);
  const [imageFileUrl, setImageFileUrl] = useState(null);
  const filePickerRef = useRef(null);
  const [imageFileUploadProgress, setImageFileUploadProgress] = useState(0);
  const [imageFileUploadError, setImageFileUploadError] = useState(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const API_ENDPOINT = import.meta.env.VITE_PUBLIC_AWS_API_ENDPOINT;

  const handleImageChange = (e) => {
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
      setImageFile(file);
      setImageFileUrl(URL.createObjectURL(file));
    }
    // Track the initial load progress
    const reader = new FileReader();
    reader.onprogress = (data) => {
      if (data.lengthComputable) {
        const progress = Math.round((data.loaded / data.total) * 100);
        setImageFileUploadProgress(progress);
      }
    };
    reader.onloadend = () => {
      setImageFileUploadProgress(100);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = useCallback(
    async (presignedUrl) => {
      setImageFileUploadError(null);
      try {
        const uploadResponse = await axios.put(presignedUrl, imageFile, {
          headers: {
            "Content-Type": imageFile.type,
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
        setImageFile(null);
        setImageFileUrl(null);
        setImageFileUploadProgress(null);
      }
    },
    [imageFile, setImageFileUploadProgress]
  );

  const getPresignedUrl = useCallback(async () => {
    if (!imageFile) {
      window.alert("No file selected. Please select a file.");
      throw new Error("No file selected.");
    }

    const filename = new Date().getTime() + "_" + imageFile.name;
    const maxSizeInMB = 2;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    try {
      const response = await axios({
        method: "GET",
        url: API_ENDPOINT,
        params: {
          filename: filename,
          contentType: imageFile.type,
          maxSize: maxSizeInBytes,
        },
      });
      const presignedUrl = response.data.presignedUrl;
      const s3ObjectUrl = response.data.s3ObjectUrl;
      return { presignedUrl, s3ObjectUrl };
      // return response.data.url;
    } catch (error) {
      setImageFileUploadError("Error getting presigned URL: " + error.message);
      throw error;
    }
  }, [imageFile, API_ENDPOINT]);

  useEffect(() => {
    if (imageFile) {
      const upload = async () => {
        const { presignedUrl, s3ObjectUrl } = await getPresignedUrl();
        await uploadImage(presignedUrl);
        setUploadUrl(s3ObjectUrl);

        setTimeout(() => {
          setImageFileUploadProgress(null);
        }, 5000);
      };
      upload();
    }
  }, [imageFile, getPresignedUrl, uploadImage]);

  return (
    <div className="max-w-lg mx-auto p-3 w-full">
      <h1 className="my-7 text-center font-semibold text-3xl">Profile</h1>
      <form className="flex flex-col gap-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          ref={filePickerRef}
          hidden
        />
        <div
          className="relative w-32 h-32 self-center cursor-pointer shadow-md overflow-hidden rounded-full"
          onClick={() => filePickerRef.current.click()}
        >
          <img
            src={imageFileUrl || currentUser.profilePicture}
            alt="user"
            className={`rounded-full w-full h-full object-cover border-8 border-[lightgray] ${
              imageFileUploadProgress &&
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
                  stroke: `rgba(84, 171, 65, ${imageFileUploadProgress / 100})`,
                },
                text: {
                  fill: "#54ab41",
                  fontSize: "26px", // Change the font size if necessary
                  fontWeight: "bold", // Change the font weight if necessary
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
        />
        <TextInput
          type="email"
          id="email"
          placeholder="email"
          defaultValue={currentUser.email}
        />
        <TextInput type="password" id="password" placeholder="password" />
        <Button type="submit" gradientDuoTone="purpleToBlue" outline>
          Update
        </Button>
      </form>
      <div className="text-red-500 flex justify-between mt-5">
        <span className="cursor-pointer">Delete Account</span>
        <span className="cursor-pointer">Sign Out</span>
      </div>
    </div>
  );
}
