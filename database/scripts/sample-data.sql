-- -----------------------------------------------------
-- Sample data
-- -----------------------------------------------------

delete from user_role where id > 0;
INSERT INTO `user_role` (`id`,`name`) VALUES (1,'super admin');
INSERT INTO `user_role` (`id`,`name`) VALUES (2,'content creator');
INSERT INTO `user_role` (`id`,`name`) VALUES (3,'user');

delete from user where id > 0;
INSERT INTO `user` (`id`, `name`, `email`, `password`, `roleId`, `workingStatus`, `loginStatus`, `avatarBG`) VALUES ('1', 'super admin', 'sa@lokpoll.com', '1234', '1', 'active', 'online', '#4c5264');


INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('odiya', 'or', '1', 'उड़िया');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('hindi', 'hi', '1', 'हिन्दी');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('english', 'en', '1', 'अंग्रेज़ी');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('marathi', 'mr', '1', 'मराठी');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('gujarati', 'gu', '1', 'गुजराती');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('bengali', 'bn', '1', 'बंगाली');
INSERT INTO `language` (`name`, `code`, `isActive`, `translation`) VALUES ('sambalpuri', 'spv', '1', 'संबलपुरी');

INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`) VALUES (1,'Party',NULL,1,NULL,'#0000ff');
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`) VALUES (2,'Masti',NULL,1,NULL,'#ff00ff');
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`) VALUES (3,'Happy',NULL,1,NULL,'#ffff00');
INSERT INTO `mood` (`id`,`name`,`createdAt`,`createdBy`,`description`,`color`) VALUES (4,'Sad',NULL,1,NULL,'#8080ff');
