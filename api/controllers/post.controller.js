import Post from "../models/post.model.js";
import { errorHandler } from "../utils/error.js";

export const create = async (req, res, next) => {
	if (!req.user.isAdmin) {
		return next(errorHandler(403, "You are not allowed to create a post"));
	}
	if (!req.body.title || !req.body.sections || req.body.sections.length === 0) {
        return next(errorHandler(400, "Title and Sections are required"));
    }
	const slug = req.body.title
		.split(" ")
		.join("-")
		.toLowerCase()
		.replace(/[^a-zA-Z0-9-]/g, "");
	const newPost = new Post ({
		...req.body,
		slug,
		userId: req.user.id,
	});
    try {
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
		console.log("error:", error);
        next(error);
    }
};
