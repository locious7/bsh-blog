import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
			unique: true,
		},
		content: {
			type: String,
			required: true,
		},
		image: {
			type: String,
			default:
				"https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.websites.hibu.com%2F97df2096307b4f18a0f85bf1ed3dceb8%2Fdms3rep%2Fmulti%2Fblog-c341ba1a.png&f=1&nofb=1&ipt=9d6f92209a698376d12139ae3f2c450ad09f4f7e5e6bbbfa892b62e311e06f1b&ipo=images",
		},
		category: {
			type: String,
			default: "uncategorized",
		},
		slug: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{ timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;