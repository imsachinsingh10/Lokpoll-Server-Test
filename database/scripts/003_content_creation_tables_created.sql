insert into db_logs (`dev`, scriptName) values ('himanshu', '003_content_creation_tables_created.sql');

-- -----------------------------------------------------
-- Table `post`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `post`;
CREATE TABLE `post` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` bigint(20) DEFAULT 0,
  `moodId` bigint(20) DEFAULT 0,
  `description` longtext DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `latitude` varchar(100) DEFAULT NULL,
  `longitude` varchar(100) DEFAULT NULL,
  `isActive` tinyint(2) DEFAULT 0,
  `isVerified` tinyint(2) DEFAULT 0,
  `verifiedBy` bigint(20) DEFAULT 0,
  `verifiedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);


-- -----------------------------------------------------
-- Table `mood`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mood`;
CREATE TABLE `mood` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `createdBy` bigint(20) DEFAULT 0,
  `description` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `post_media`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `post_media`;
CREATE TABLE `post_media` (
   `id` bigint(20) NOT NULL AUTO_INCREMENT,
   `postId` bigint(20) DEFAULT 0,
   `commentId` bigint(20) DEFAULT 0,
   `type` varchar(100) DEFAULT NULL,
   `url` longtext DEFAULT NULL,
   PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `post_location`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `post_location`;
CREATE TABLE `post_location` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `postId` bigint(20) DEFAULT 0,
  `latitude` varchar(100) DEFAULT NULL,
  `longitude` varchar(100) DEFAULT NULL,
  `address` longtext DEFAULT NULL,
  `pinCode` varchar(100) DEFAULT NULL,
   PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `post_reaction`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `post_reaction`;
CREATE TABLE `post_reaction` (
   `id` bigint(20) NOT NULL AUTO_INCREMENT,
   `postId` bigint(20) DEFAULT 0,
   `reactedBy` bigint(20) DEFAULT 0,
   `type` varchar(100) DEFAULT NULL,
   `reactedAt` datetime DEFAULT NULL,
   PRIMARY KEY (`id`)
);

-- -----------------------------------------------------
-- Table `post_comment`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `post_comment`;
CREATE TABLE `post_comment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `postId` bigint(20) DEFAULT 0,
  `replyToCommentId` bigint(20) DEFAULT 0,
  `userId` bigint(20) DEFAULT 0,
  `comment` longtext DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);
