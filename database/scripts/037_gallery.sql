CREATE TABLE `gallery` (
  `id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `createdDate` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
