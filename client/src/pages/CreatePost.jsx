import React, { useState, useCallback, useEffect, useRef } from "react";
import { Alert, Button, FileInput, Select, Spinner, TextInput } from "flowbite-react";
import axios from "axios";
import { useSelector } from "react-redux";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { PlusCircle, Type, Image as ImageIcon, Film, Link, X, Plus } from 'lucide-react';
import { useNavigate } from "react-router-dom";

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
	const [imageFileUploadError, setImageFileUploadError] = useState(null);
	const [imageFileUploadProgress, setImageFileUploadProgress] = useState(0);
	const [formData, setFormData] = useState({
		title: '',
		category: 'uncategorized',
		sections: []
	});
	const [isMenuExpanded, setIsMenuExpanded] = useState(false);
	const [plusButtonPosition, setPlusButtonPosition] = useState(0);
	const [imagePreviews, setImagePreviews] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitProgress, setSubmitProgress] = useState(0);
	const [publishError, setPublishError] = useState(null);
	const fileInputRef = useRef(null);
	const plusButtonRef = useRef(null);
	const formRef = useRef(null);
	const API_ENDPOINT = import.meta.env.VITE_PUBLIC_BLOG_POST_IMAGES_API_ENDPOINT;

	const navigate = useNavigate();

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prevData => {
			const updatedData = { ...prevData, [name]: value }
			console.log("FormData Updated:", updatedData); // Log form data
			return updatedData;
		});
	};

	const handleImageChange = async (e, index) => {
		setImageFileUploadError(null);
		setImageFileUploadProgress(0);
		const file = e.target.files[0];

		if (!file) return;

		const maxSizeInMB = 10;
		const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
		const acceptedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/apng", "image/avif"];

		if (!acceptedImageTypes.includes(file.type)) {
			setImageFileUploadError("Only image files are allowed.");
			return;
		}
		if (file.size > maxSizeInBytes) {
			setImageFileUploadError(`File size exceeds the limit of ${maxSizeInMB} MB. Please select a smaller file.`);
			return;
		}

		try {
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreviews(prev => ({ ...prev, [index]: reader.result }));
				setFormData(prevData => {
					const newSections = [...prevData.sections];
					newSections[index] = { ...newSections[index], content: file };
					return { ...prevData, sections: newSections };
				});
			};
			reader.readAsDataURL(file);
		} catch (error) {
			setPublishError(`Error processing image: ${error.message}`);
		}
	};

	const getPresignedUrl = useCallback(async (key, file = null) => {
		try {
			const params = { filename: key, };
			if (file) { params.contentType = file.type; }

			const response = await axios.get(API_ENDPOINT, { params });
			return response.data;
		} catch (error) {
			console.error(`Error getting presigned URL:`, error);
			throw error;
		}
	}, [API_ENDPOINT]);

	const uploadImage = async (file) => {
		setImageFileUploadError(null);
		setImageFileUploadProgress(0);
		try {
			const filename = new Date().getTime() + "_" + file.name + "_" + `${currentUser._id}`;
			const { presignedPutUrl, presignedGetUrl } = await getPresignedUrl(filename, file);

			await axios.put(presignedPutUrl, file, {
				headers: {
					"Content-Type": file.type,
				},
				onUploadProgress: (progressEvent) => {
					const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					setImageFileUploadProgress(percentCompleted);
				},
			});

			setImageFileUploadProgress(100);
			return { filename };
		} catch (error) {
			setImageFileUploadError(`Error uploading file: ${error.message}`);
			throw error;
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSubmitProgress(0);

		console.log("Submitting FormData:", formData); // Log form data before submission

		try {
			// Process sections
			const processedSections = await Promise.all(formData.sections.map(async (section, index) => {
				if (section.type === 'image' && section.content instanceof File) {
					const imageUrl = await uploadImage(section.content);
					return { ...section, content: imageUrl.filename, order: index };
				}
				return { ...section, order: index };
			}));

			// // Generate a slug from the title
			// const slug = formData.title
			// 	.toLowerCase()
			// 	.replace(/[^a-zA-Z0-9]+/g, '-')
			// 	.replace(/^-+|-+$/g, '');

			// Prepare form data
			const finalFormData = {
				...formData,
				userId: currentUser._id,
				sections: processedSections
				// slug
			};
			console.log("Final FormData:", finalFormData); // Log final form data
			// Send data to API using fetch
			const res = await fetch('/api/post/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(finalFormData),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message || 'Failed to create post');
			}

			setIsSubmitting(false);
			setSubmitProgress(100);
			setPublishError(null);
			navigate(`/post/${data.slug}`);
		} catch (error) {
			setIsSubmitting(false);
			setSubmitProgress(0);
			setPublishError(error.message || 'An error occurred while creating the post.');
		}
	};


	const toggleMenu = () => setIsMenuExpanded(!isMenuExpanded);

	const addSection = (type) => {
		if (type === 'image') {
			fileInputRef.current.click();
		} else {
			setFormData(prevData => ({
				...prevData,
				sections: [...prevData.sections, { type, content: '' }]
			}));
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
	}, [formData.sections]); // Depend on sections to recalculate when they change


	const updateSection = (index, content) => {
		setFormData(prevData => {
			const updatedSections = [...prevData.sections];
			updatedSections[index] = { ...updatedSections[index], ...content };
			console.log("Section Updated:", updatedSections[index]);
			return { ...prevData, sections: updatedSections };
		});
	};

	const removeSection = (index) => {
		setFormData(prevData => ({
			...prevData,
			sections: prevData.sections.filter((_, i) => i !== index)
		}));
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
				<Plus className={`h-5 w-5 transition-transform ${isMenuExpanded ? 'rotate-45' : ''}`} />
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
						onChange={(content) => updateSection(index, { content })}
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
							onChange={(e) => updateSection(index, { content: e.target.value })}
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
				let embedContent;
				if (section.content.includes('twitter.com')) {
					// Handle Twitter embed
					embedContent = (
						<div className="twitter-embed-container flex justify-center">
							<blockquote className="twitter-tweet">
								<p>Loading Twitter content...</p>
							</blockquote>
							<script async src="https://platform.twitter.com/widgets.js"></script>
						</div>
					);
				} else if (section.content.includes('youtube.com') || section.content.includes('youtu.be')) {
					// Handle YouTube embed
					const url = getEmbedUrl(section.content);
					if (url) {
						embedContent = (
							<div className="youtube-embed-container flex justify-center">
								<iframe
									width="560"
									height="315"
									src={url}
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen
								></iframe>
							</div>
						);
					}
				} else if (section.content.includes('instagram.com')) {
					// Handle Instagram embed
					embedContent = (
						<div className="instagram-embed-container flex justify-center">
							<blockquote className="instagram-media">
								<p>Loading Instagram content...</p>
							</blockquote>
							<script async src="//www.instagram.com/embed.js"></script>
						</div>
					);
				} else {
					// Handle generic embed as HTML
					embedContent = (
						<div
							className="custom-embed-container flex justify-center"
							style={embedStyles.embedContainer}
							dangerouslySetInnerHTML={{ __html: section.content }}
						></div>
					);
				}
				return (
					<div className="flex flex-col gap-3">
						<TextInput
							type="text"
							placeholder="Enter embed code or URL"
							value={section.content}
							onChange={(e) => updateSection(index, { content: e.target.value })}
						/>
						{embedContent && (
							<div className="embed-preview">
								{embedContent}
							</div>
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
			return videoId, `https://www.youtube.com/embed/${videoId}`;
		} else if (url.includes('vimeo.com')) {
			const videoId = url.split('/').pop();
			return videoId, `https://player.vimeo.com/video/${videoId}`;
		} else if (url.includes('a.co/d') || url.includes('amazon.com')) {
			const productId = url.split('/').pop();
			return productId, `https://a.co/d/${productId}`;
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
							id="title"
							name="title"
							value={formData.title}
							onChange={handleInputChange}
							placeholder="Enter your post title"
							className="text-3xl font-bold mb-4 flex-1"
							required
						/>
						<Select
							name="category"
							value={formData.category}
							onChange={handleInputChange}
						>
							<option value="uncategorized">Select a category</option>
							<option value="Faith">Faith</option>
							<option value="Food">Food</option>
							<option value="Fun">Fun</option>
						</Select>
					</div>
					{formData.sections.map((section, index) => (
						<div key={index} className="mb-4 relative">
							{renderSection(section, index)}
							<Button
								color=""
								size="sm"
								className="absolute top-1 right-1 bg-gray-800"
								onClick={() => removeSection(index)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					))}

					{imageFileUploadError && (
						<Alert color="failure">{imageFileUploadError}</Alert>
					)}

					<Button type="submit" className="mt-12" disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner className="h-4 w-4 mr-2" />
								Publishing...
							</>
						) : (
							'Create Post'
						)}
					</Button>
					{publishError && (
						<Alert className='mt-5' color='failure'>
							{publishError}
						</Alert>
					)}
				</form>
			</div>
			<input
				type="file"
				ref={fileInputRef}
				style={{ display: 'none' }}
				onChange={(e) => {
					const newIndex = formData.sections.length;
					setFormData(prevData => ({
						...prevData,
						sections: [...prevData.sections, { type: 'image', content: '' }]
					}));
					handleImageChange(e, newIndex);
				}}
				accept="image/*"
			/>
		</div>
	);
}

