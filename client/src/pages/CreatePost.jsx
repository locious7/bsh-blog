import { Alert, Button, FileInput, Select, TextInput } from "flowbite-react";
import { useState } from "react";
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
	const API_ENDPOINT = import.meta.env
		.VITE_PUBLIC_BLOG_POST_IMAGES_API_ENDPOINT;

	const handleImageChange = (e) => {
		setFile(e.target.files[0]);
		setImageFileUploadProgress(0);
		setImageFileUploadError(null);
		setImageFileUrl(null);
	};

	const handleImageUpload = async () => {
		if (!file) {
			setImageFileUploadError("Please choose an image file first.");
			return;
		}
		const maxSizeInMB = 10;
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

		setImageFileUploading(true);

		// Handle upload directly after file is selected
		try {
			const { presignedPutUrl, presignedGetUrl } = await getPresignedUrls(file);

            // Upload image using the presigned PUT URL
            await uploadImage(presignedPutUrl, file);

            // Set the presigned GET URL for viewing the uploaded image
            setImageFileUrl(presignedGetUrl);

			// const { presignedUrl, s3ObjectUrl } = await getPresignedUrl(file);
			// await uploadImage(presignedUrl, file);
			// setImageFileUrl(presignedUrl);
			setFormData({ ...formData, image: presignedGetUrl });
		} catch (error) {
			setImageFileUploadError("Error during upload: " + error.message);
		} finally {
			setImageFileUploading(false);
		}
	};

	const getPresignedUrls = async (file) => {
		const filename = new Date().getTime() + "_" + file.name;
		// const maxSizeInMB = 2;
		// const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

		try {
			const response = await axios({
				method: "GET",
				url: API_ENDPOINT,
				params: {
					filename: filename,
					contentType: file.type,
					// maxSize: maxSizeInBytes,
				},
			});
			const presignedPutUrl = response.data.presignedPutUrl;
            const presignedGetUrl = response.data.presignedGetUrl;
            return { presignedPutUrl, presignedGetUrl };
			// const presignedUrl = response.data.presignedUrl;
			// const s3ObjectUrl = response.data.s3ObjectUrl;
			// return { presignedUrl, s3ObjectUrl };
		} catch (error) {
			setImageFileUploadError("Error getting presigned URL: " + error.message);
			throw error;
		}
	};

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
		}
	};

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
				{formData.image && (
					<img
						src={formData.image}
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
