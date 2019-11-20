insert into db_logs (`dev`, scriptName) values ('himanshu', '003_content_creation_tables_created.sql');


post
	id,
	userId,
	moodId,
	description,
	createdAt
	lattitude,
	longitude
	isActive
	isVerified
	verifiedBy
	verifiedAt

mood
	id
	name
	createdAt
	createdBy
	description

post_media
	id
	postId
	commentId
	type (image | video)
	url

post_location
	id
	postId
	lattitude
	longitude
	address
	pinCode

post_reaction
	id
	postId
	reactedBy
	type (respect, )
	reactedAt

post_comment
	id
	postId
	userId
	comment
	createdAt
	replyToCommentId

