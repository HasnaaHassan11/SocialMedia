const { Router } = require("express");
const UserService = require("../services/user.service");
const ErrorEx = require("../util/ErrorEx");
const PostService = require("../services/post.service");

const UserController = Router();

UserController.get("/", async function (req, res) {
	res.redirect("/user/" + res.locals.userid);
});

UserController.get("/edit", async function (req, res) {
	const { message } = req.query;

	try {
		const user = await (new UserService).getUserProfile(res.locals.userid);
		
		res.render("edit", {
			message, 
			...user
		});
	}
	catch(error) {
		if(error instanceof ErrorEx) {
			res.status(error.statusCode).send({
				message: error.message,
				code: error.code
			});
		}
		else {
			console.log(error);
			res.status(500).send("Server Error. Please try again later.");
		}
	}
});
UserController.get("/search", async function(req, res) {

	const { q } = req.query;

	try {
		if(!q) {
			throw new ErrorEx("Please supply a query", "search/no-query", 400);
		}
		else if(q.length === 0 ) {
			throw new ErrorEx("Please supply a query", "search/no-query", 400);
		}
		else {
			const userService = new UserService();

			const profile = await userService.getUserId(q);

			res.redirect("/user/" + profile);
		}
	}
	catch(error) {
		if(error instanceof ErrorEx) {
			if(error.code === "auth/account-not-found") {
				res.render("404");
			}
			else {
				res.status(error.statusCode).send({
					message: error.message,
					code: error.code
				});
			}
		}
		else {
			console.log(error);
			res.status(500).send("Server Error. Please try again later.");
		}
	}
});

UserController.get("/:userid", async function (req, res) {
	const { userid } = req.params;

	try {
		const userService = new UserService();
		const postService = new PostService();

		const profile = await userService.getUserProfile(userid);
		const userProfile = await userService.getUserProfile(res.locals.userid);
		const posts = await postService.getPostsByUser(res.locals.userid, userid);
		
		if(userid == res.locals.userid) {
			res.render("myProfile", { profile, posts });
		}
		else {
			const isFollowing = await userService.isFollowing(res.locals.userid, userid);

			res.render("profile", { profile, userProfile, isFollowing, posts });
		}
	}
	catch(error) {
		if(error instanceof ErrorEx) {
			res.status(error.statusCode).send({
				message: error.message,
				code: error.code
			});
		}
		else {
			console.log(error);
			res.status(500).send("Server Error. Please try again later.");
		}
	}
});

UserController.post("/:userid/follow", async function (req, res) {

	const { userid } = req.params;

	try {

		await (new UserService).followUser(res.locals.userid, userid);

		res.redirect("/user/" + userid);
	}
	catch(error) {
		if(error instanceof ErrorEx) {
			res.status(error.statusCode).send({
				message: error.message,
				code: error.code
			});
		}
		else {
			console.log(error);
			res.status(500).send("Server Error. Please try again later.");
		}
	}

});
UserController.post("/:userid/unfollow", async function (req, res) {

	const { userid } = req.params;

	try {

		await (new UserService).unfollowUser(res.locals.userid, userid);

		res.redirect("/user/" + userid);
	}
	catch(error) {
		if(error instanceof ErrorEx) {
			res.status(error.statusCode).send({
				message: error.message,
				code: error.code
			});
		}
		else {
			console.log(error);
			res.status(500).send("Server Error. Please try again later.");
		}
	}

});

UserController.post("/update",  async function (req, res) {
	const { username, bio } = req.body;
	
	try {
		if(!username) {
			throw new ErrorEx("Username cannot be empty.", "profile/empty-username", 400);
		}
		else {
			const userService = new UserService();
			
			await userService.updateProfile(res.locals.userid, username, bio ? bio : "");

			res.redirect("/user");
		}
	}
	catch(error) {
		if(error instanceof ErrorEx) {
			res.redirect(`/user/edit?message=${error.message}`);
		}
		else {
			console.log(error);
			res.status(500).send("Server Error. Please try again later.");
		}
	}
})

module.exports = UserController;