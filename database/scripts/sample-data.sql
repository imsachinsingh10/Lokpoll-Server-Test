-- -----------------------------------------------------
-- Sample data
-- -----------------------------------------------------

delete from user_role where id > 0;
INSERT INTO `user_role` (`id`,`name`) VALUES (1,'super admin');
INSERT INTO `user_role` (`id`,`name`) VALUES (2,'content creator');
INSERT INTO `user_role` (`id`,`name`) VALUES (3,'user');

delete from user where id > 0;
INSERT INTO `lokpoll`.`user` (`firstName`, `lastName`, `email`, `password`, `roleId`, `workingStatus`, `loginStatus`, `avatarBG`) VALUES ('super', 'admin', 'sa@lokpoll.com', '1234', '1', 'active', 'online', '#4c5264');


INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('odiya', 'or', '1');
INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('hindi', 'hi', '1');
INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('english', 'en', '1');
INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('marathi', 'mr', '1');
INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('gujarati', 'gu', '1');
INSERT INTO `lokpoll`.`language` (`name`, `code`, `isActive`) VALUES ('bengali', 'bn', '1');
