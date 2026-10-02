
SET default_transaction_read_only = off;

SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SET escape_string_warning = off;

ALTER ROLE "anon" SET "statement_timeout" TO '3s';

ALTER ROLE "authenticated" SET "statement_timeout" TO '8s';

ALTER ROLE "authenticator" SET "statement_timeout" TO '8s';

RESET ALL;
