import { Alert, Button, FileInput, Select, TextInput } from "flowbite-react";
import React, { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { PlusCircle, Type, Image as ImageIcon, Film, Link, X, Plus } from 'lucide-react';

const embedStyles = {
	embedContainer: {
		position: 'relative',
		paddingBottom: '56.25%', // 16:9 aspect ratio
		height: 0,
		overflow: 'hidden',
		maxWidth: '100%'
	},
	embedIframe: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
	},
};

export default function CreatePost() {
	const { currentUser, error, loading } = useSelector((state) => state.user);
	const [file, setFile] = useState(null);
	const [imageFileUploadError, setImageFileUploadError] = useState(null);
	const [imageFileUploadProgress, setImageFileUploadProgress] = useState(0);
	const [imageFileUploading, setImageFileUploading] = useState(false);
	const [imageFileUrl, setImageFileUrl] = useState(null);
	const [title, setTitle] = useState('');
	const [sections, setSections] = useState([]);
	const [formData, setFormData] = useState({});
	const [isMenuExpanded, setIsMenuExpanded] = useState(false);
	const [plusButtonPosition, setPlusButtonPosition] = useState(0);
	const [imagePreviews, setImagePreviews] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitProgress, setSubmitProgress] = useState(0);
	const fileInputRef = useRef(null);
	const plusButtonRef = useRef(null);
	const formRef = useRef(null);
	const API_ENDPOINT = import.meta.env.VITE_PUBLIC_BLOG_POST_IMAGES_API_ENDPOINT;

	const handleImageChange = (e, index) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreviews(prev => ({ ...prev, [index]: reader.result }));
				updateSection(index, { type: 'image', content: file });
			};
			reader.readAsDataURL(file);
		}
	};


	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSubmitProgress(0);

		try {
			// Upload images and get their URLs
			const uploadedImages = await Promise.all(
				sections
					.filter(section => section.type === 'image' && section.content instanceof File)
					.map(async (section, index) => {
						const file = section.content;
						const filename = new Date().getTime() + "_" + file.name + "_" + `${currentUser._id}`;
						const { presignedPutUrl, presignedGetUrl } = await getPresignedUrl(filename, file, true);
						await uploadImage(presignedPutUrl, file);
						return { index, url: presignedGetUrl };
					})
			);

			// Update sections with uploaded image URLs
			const updatedSections = sections.map((section, index) => {
				const uploadedImage = uploadedImages.find(img => img.index === index);
				if (uploadedImage) {
					return { ...section, content: uploadedImage.url };
				}
				return section;
			});

			// Here you would typically send the entire post data to your backend
			// For example:
			// await axios.post('/api/posts', { title, sections: updatedSections });

			setIsSubmitting(false);
			setSubmitProgress(100);
			// Handle successful submission (e.g., show success message, redirect)
		} catch (error) {
			setIsSubmitting(false);
			setSubmitProgress(0);
			// Handle error (e.g., show error message)
		}
	};

	const getPresignedUrl = useCallback(async (key, file = null, isUpload = false) => {
		try {
			const params = { filename: key, };
			if (isUpload && file) { params.contentType = file.type; }

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

	const handleImageUpload = async (index) => {
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
				setFormData({ ...formData, image: filename });
				updateSection(index, presignedGetUrl);
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

	const toggleMenu = () => {
		setIsMenuExpanded(!isMenuExpanded);
	};

	const addSection = (type) => {
		if (type === 'image') {
			fileInputRef.current.click();
		} else {
			setSections([...sections, { type, content: '' }]);
		}
		setIsMenuExpanded(false);
	};

	useEffect(() => {
		const updatePlusButtonPosition = () => {
			if (formRef.current && plusButtonRef.current) {
				let newPosition = 0;
				// Find the last section element
				const lastSectionIndex = formRef.current.children.length - 2; // Adjusted to exclude the Create Post button
				if (lastSectionIndex > 1) { // Ensure there's at least one section added
					const lastSectionElement = formRef.current.children[lastSectionIndex];
					if (lastSectionElement) {
						const lastSectionRect = lastSectionElement.getBoundingClientRect();
						newPosition = lastSectionRect.bottom - formRef.current.getBoundingClientRect().top + 8; // Added spacing
					}
				} else {
					// Fallback to position below category if no sections added yet
					const categoryElement = formRef.current.children[1]; // Assuming category is the second child
					if (categoryElement) {
						const categoryRect = categoryElement.getBoundingClientRect();
						newPosition = categoryRect.bottom - formRef.current.getBoundingClientRect().top + 10; // Added spacing
					}
				}
				// Ensure the plus button does not go below the Create Post button
				const createPostButton = formRef.current.children[formRef.current.children.length - 1]; // Assuming Create Post is the last child
				const createPostButtonTop = createPostButton.getBoundingClientRect().top - formRef.current.getBoundingClientRect().top;
				if (newPosition + plusButtonRef.current.offsetHeight > createPostButtonTop) {
					newPosition = createPostButtonTop - plusButtonRef.current.offsetHeight - 20; // Adjust spacing to ensure it's above the Create Post button
				}
				setPlusButtonPosition(newPosition);
				plusButtonRef.current.style.top = `${newPosition}px`;
			}
		};

		updatePlusButtonPosition();
		window.addEventListener('resize', updatePlusButtonPosition);
		// Assuming you have a mechanism to trigger this when sections change
		window.addEventListener('sectionsChange', updatePlusButtonPosition);
		return () => {
			window.removeEventListener('resize', updatePlusButtonPosition);
			window.removeEventListener('sectionsChange', updatePlusButtonPosition);
		};
	}, [sections]); // Depend on sections to recalculate when they change


	const updateSection = (index, newSection) => {
		const updatedSections = [...sections];
		updatedSections[index] = newSection;
		setSections(updatedSections);
	};

	const removeSection = (index) => {
		const updatedSections = sections.filter((_, i) => i !== index);
		setSections(updatedSections);
	};

	const renderPlusButton = () => (
		<div ref={plusButtonRef} className="absolute left-0 transition-all duration-300 ease-in-out">
			<Button
				color="gray"
				pill
				size="md"
				onClick={toggleMenu}
				className="shadow-lg"
			>
				<Plus className={`h-6 w-6 transition-transform ${isMenuExpanded ? 'rotate-45' : ''}`} />
			</Button>
			{isMenuExpanded && (
				<div className="absolute top-0 left-full ml-2 flex flex-row gap-1 shadow-lg rounded-lg p-1 z-10">
					<Button onClick={() => addSection('text')} className="flex items-center justify-center">
						<Type className="h-4 w-4" />
					</Button>
					<Button onClick={() => addSection('image')} className="flex items-center justify-center">
						<ImageIcon className="h-4 w-4" />
					</Button>
					<Button onClick={() => addSection('video')} className="flex items-center justify-center">
						<Film className="h-4 w-4" />
					</Button>
					<Button onClick={() => addSection('embed')} className="flex items-center justify-center">
						<Link className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);

	const renderSection = (section, index) => {
		switch (section.type) {
			case 'text':
				return (
					<ReactQuill
						theme="snow"
						value={section.content}
						onChange={(content) => updateSection(index, { ...section, content })}
						placeholder="Write something..."
					/>
				);
			case 'image':
				return (
					<div className="flex flex-col gap-6">
						<FileInput
							onChange={(e) => handleImageChange(e, index)}
							accept="image/*"
						/>
						{(section.content instanceof File || imagePreviews[index] || section.content) && (
							<div className="flex justify-center">
								<img
									src={section.content instanceof File ? imagePreviews[index] : section.content}
									alt="Preview"
									style={{ maxWidth: '400px', maxHeight: '400px' }}
									className="object-cover"
								/>
							</div>
						)}
					</div>
				);
			case 'video':
				return (
					<div className="flex flex-col gap-3">
						<TextInput
							type="text"
							placeholder="Enter video URL (YouTube, Vimeo, etc.)"
							value={section.content}
							onChange={(e) => updateSection(index, { ...section, content: e.target.value })}
						/>
						{section.content && (
							<div style={embedStyles.embedContainer}>
								<iframe
									src={getEmbedUrl(section.content)}
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen
									style={embedStyles.embedIframe}
								></iframe>
							</div>
						)}
					</div>
				);
			case 'embed':
				return (
					<div className="flex flex-col gap-3">
						<TextInput
							type="text"
							placeholder="Enter embed code or URL"
							value={section.content}
							onChange={(e) => updateSection(index, { ...section, content: e.target.value })}
						/>
						{section.content && (
							<div
								style={embedStyles.embedContainer}
								dangerouslySetInnerHTML={{ __html: section.content }}
							></div>
						)}
					</div>
				);
			default:
				return null;
		}
	};

	const getEmbedUrl = (url) => {
		if (url.includes('youtube.com') || url.includes('youtu.be')) {
			const videoId = url.split('v=')[1] || url.split('/').pop();
			return `https://www.youtube.com/embed/${videoId}`;
		} else if (url.includes('vimeo.com')) {
			const videoId = url.split('/').pop();
			return `https://player.vimeo.com/video/${videoId}`;
		}
		// Add more video platform checks as needed
		return url; // Return original URL if not recognized
	};

	return (
		<div className="p-3 max-w-4xl mx-auto min-h-screen mb-10">
			<h1 className="text-center text-3xl my-7 ml-20 font-semibold">
				Create A Post
			</h1>
			<div className="flex flex-row gap-4 relative">
				<div className="w-16 relative mt-2">
					{renderPlusButton()}
				</div>
				<form onSubmit={handleSubmit} ref={formRef} className="flex-1 flex flex-col gap-4">
					<div className="flex flex-col gap-4 sm:flex-row justify-between">
						<TextInput
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter your post title"
							className="text-3xl font-bold mb-4 flex-1"
							required
						/>
						<Select>
							<option value="uncategorized">Select a category</option>
							<option value="Faith">Faith</option>
							<option value="Food">Food</option>
							<option value="Fun">Fun</option>
						</Select>
					</div>
					{sections.map((section, index) => (
						<div key={index} className="mb-4 relative">
							{renderSection(section, index)}
							<Button
								color="gray"
								size="sm"
								className="absolute top-1 right-1"
								onClick={() => removeSection(index)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					))}

					{imageFileUploadError && (
						<Alert color="failure">{imageFileUploadError}</Alert>
					)}

					<Button type="submit" gradientDuoTone="purpleToPink" className="mt-12">
						Create Post
					</Button>
				</form>
			</div>
			<input
				type="file"
				ref={fileInputRef}
				style={{ display: 'none' }}
				onChange={(e) => handleImageChange(e, sections.length)}
				accept="image/*"
			/>
		</div>
	);
}

