// Declarations for deprecated escaping functions

// These are used in the Vault utf8ToBase64 and base64ToUtf8 functions in order to ensure correct encoding
// of encrypted strings, which might sometimes contain UTF-8 encoded charcter data. We use a combination of
// encodeURIComponent(escape()) and unescape(decodeURIComponent()). Although these functions are deprecated,
// there is currently no supported alternative for UTF-8 text handling (short of hand-writing an encoder).

// See here for a detailed explanation on why this works:
// https://ecmanaut.blogspot.co.uk/2006/07/encoding-decoding-utf8-in-javascript.html

declare function escape(s: string): string;
declare function unescape(s: string): string;
