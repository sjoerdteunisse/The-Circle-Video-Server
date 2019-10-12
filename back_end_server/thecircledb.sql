-- phpMyAdmin SQL Dump
-- version 4.8.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Gegenereerd op: 17 jun 2019 om 15:25
-- Serverversie: 10.1.34-MariaDB
-- PHP-versie: 7.2.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `thecircledb`
--
CREATE DATABASE IF NOT EXISTS `thecircledb` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `thecircledb`;

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `chat`
--

DROP TABLE IF EXISTS `chat`;
CREATE TABLE IF NOT EXISTS `chat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` varchar(150) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sender_id` int(20) NOT NULL,
  `streamer_id` int(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `time` (`timestamp`,`message`),
  KEY `user_id` (`sender_id`),
  KEY `streamer_id` (`streamer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=165 DEFAULT CHARSET=latin1;


--
-- Tabelstructuur voor tabel `trueyouusers`
--

DROP TABLE IF EXISTS `trueyouusers`;
CREATE TABLE IF NOT EXISTS `trueyouusers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(50) NOT NULL,
  `prefix` varchar(10) DEFAULT NULL,
  `lastname` varchar(100) NOT NULL,
  `avatarUrl` longtext NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `country` varchar(50) NOT NULL,
  `dateOfBirth` date NOT NULL,
  `satoshiBalance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `residence` varchar(50) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '0',
  `publicKey` varchar(2048) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;


-- Beperkingen voor geëxporteerde tabellen
--

--
-- Beperkingen voor tabel `chat`
--
ALTER TABLE `chat`
  ADD CONSTRAINT `chat_ibfk_1` FOREIGN KEY (`streamer_id`) REFERENCES `trueyouusers` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `chat_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `trueyouusers` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
