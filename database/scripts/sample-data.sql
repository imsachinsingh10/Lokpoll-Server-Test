-- -----------------------------------------------------
-- Sample data
-- -----------------------------------------------------

delete from user_role where id > 0;
INSERT INTO `user_role` (`id`,`name`) VALUES (1,'super admin');
INSERT INTO `user_role` (`id`,`name`) VALUES (2,'content creator');
INSERT INTO `user_role` (`id`,`name`) VALUES (3,'user');

delete from user where id > 0;
INSERT INTO `user` (`name`, `email`, `password`, `roleId`, `workingStatus`, `loginStatus`, `avatarBG`) VALUES ('super admin', 'sa@lokpoll.com', '1234', '1', 'active', 'online', '#4c5264');


INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('odiya', 'or', '1', 'उड़िया');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('hindi', 'hi', '1', 'हिन्दी');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('english', 'en', '1', 'अंग्रेज़ी');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('marathi', 'mr', '1', 'मराठी');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('gujarati', 'gu', '1', 'गुजराती');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('bengali', 'bn', '1', 'बंगाली');

INSERT INTO `age_range` (`id`,`min`,`max`) VALUES (1,18,24);
INSERT INTO `age_range` (`id`,`min`,`max`) VALUES (2,25,34);
INSERT INTO `age_range` (`id`,`min`,`max`) VALUES (3,35,40);
INSERT INTO `age_range` (`id`,`min`,`max`) VALUES (4,41,NULL);

INSERT INTO `profile_type` (`id`,`name`) VALUES (1,'Personal');
INSERT INTO `profile_type` (`id`,`name`) VALUES (2,'Business');
INSERT INTO `profile_type` (`id`,`name`) VALUES (3,'Anonymous');

INSERT INTO `post_type` (`id`,`name`) VALUES (1,'Normal');
INSERT INTO `post_type` (`id`,`name`) VALUES (2,'Selling');
INSERT INTO `post_type` (`id`,`name`) VALUES (3,'Offer');
