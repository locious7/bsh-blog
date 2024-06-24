import { Alert, Button, FileInput, Select, TextInput } from "flowbite-react";
import { useState, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function CreatePost() {
	const { currentUser, error, loading } = useSelector((state) => state.user);
	const [file, setFile] = useState(null);
	const [imageFileUploadError, setImageFileUploadError] = useState(null);
	const [imageFileUploadProgress, setImageFileUploadProgress] = useState(0);
	const [imageFileUploading, setImageFileUploading] = useState(false);
	const [imageFileUrl, setImageFileUrl] = useState(null);
	const [formData, setFormData] = useState({});
	const API_ENDPOINT = import.meta.env.VITE_PUBLIC_BLOG_POST_IMAGES_API_ENDPOINT;

	const handleImageChange = (e) => {
		setFile(e.target.files[0]);
		setImageFileUploadProgress(0);
		setImageFileUploadError(null);
		setImageFileUrl(null);
	};

	const getPresignedUrl = useCallback(async (key, file = null, isUpload = false) => {
		try {
			const params = {filename: key,};
			if (isUpload && file) {params.contentType = file.type;}

			const response = await axios.get(API_ENDPOINT, { params });

			if (!isUpload) {
				setImageFileUrl(response.data.presignedGetUrl);
				// dispatch(setProfileImageUrl(response.data.presignedGetUrl));

			}
			return response.data;
		} catch (error) {
			console.error(`Error getting presigned URL:`, error);
			throw error;
		}
	}, [API_ENDPOINT]);

	const handleImageUpload = async () => {
		if (!file) {
			setImageFileUploadError("Please select an image file first.");
			return;
		}
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
				setFormData({...formData, image: filename});
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

	// const handleImageError = useCallback(() => {
	// 	// If the image fails to load, it might be due to an expired URL
	// 	if (currentUser.profilePicture) {
	// 		getPresignedUrl(currentUser.profilePicture);
	// 	}
	// }, [currentUser.profilePicture, getPresignedUrl]);

	return (
		<div className="p-3 max-w-4xl mx-auto min-h-screen mb-10">
			<h1 className="text-center text-3xl my-7 font-semibold">
				Create A Post
			</h1>
			<form className="flex flex-col gap-4">
				<div className="flex flex-col gap-4 sm:flex-row justify-between">
					<Select>
						<option value="uncategorized">Select a category</option>
						<option value="Faith">Faith</option>
						<option value="Food">Food</option>
						<option value="Fun">Fun</option>
					</Select>
					<TextInput
						type="text"
						placeholder="Title"
						required
						id="title"
						className="flex-1"
					/>
				</div>
				<div className="flex gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3">
					<FileInput
						type="file"
						accept="image/*"
						onChange={handleImageChange}
					/>
					<Button
						type="button"
						gradientDuoTone="purpleToBlue"
						size="sm"
						outline
						onClick={handleImageUpload}
						disabled={imageFileUploading}
					>
						{imageFileUploading ? (
							<div className="w-16 h-16">
								<CircularProgressbar
									value={imageFileUploadProgress}
									text={`${imageFileUploadProgress || 0}%`}
								/>
							</div>
						) : (
							"Upload Image"
						)}
					</Button>
				</div>
				{imageFileUploadError && (
					<Alert color="failure">{imageFileUploadError}</Alert>
				)}
				{imageFileUrl && (
					<img
						src={imageFileUrl}
						alt="upload"
						className="w-full h-72 object-cover"
					/>
				)}
				<ReactQuill
					theme="snow"
					placeholder="Write something..."
					className="h-80 mb-12"
					required
				/>
				<Button type="submit" gradientDuoTone="purpleToPink">
					Publish
				</Button>
			</form>
		</div>
	);
}
