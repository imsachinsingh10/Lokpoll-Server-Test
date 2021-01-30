insert into db_logs (`dev`, scriptName) values ('himanshu', '037_gallery.sql');

drop table if exists `gallery`;

CREATE TABLE `gallery` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `createdDate` datetime NOT NULL DEFAULT current_timestamp(),
PRIMARY KEY (`id`)  
)