import '../legacy/passpack-v1.1.js';
import { ICredential, ICryptoProvider, IPasswordSpecification } from '../types/all';

export class CryptoProvider implements ICryptoProvider {
    public base64ToUtf8(str: string) {
        return unescape(decodeURIComponent(atob(str)));
    }

    public utf8ToBase64(str: string) {
        return btoa(encodeURIComponent(escape(str)));
    }

    public getPasswordBits(password: string) {
        return Passpack.utils.getBits(password);
    }

    public hash(str: string) {
        return Passpack.utils.hashx(str);
    }

    public generatePassword(specification: IPasswordSpecification) {
        if (specification.length === 0) {
            return null;
        }

        if (specification.lowercase === false
            && specification.uppercase === false
            && specification.numbers === false
            && specification.symbols === false) {
            return null;
        }

        const options: IPasspackCharOptions = {};

        if (specification.lowercase) {
            options.lcase = 1;
        }

        if (specification.uppercase) {
            options.ucase = 1;
        }

        if (specification.numbers) {
            options.nums = 1;
        }

        if (specification.symbols) {
            options.symb = 1;
        }

        return Passpack.utils.passGenerator(options, specification.length);
    }

    public generateMasterKey(password: string) {
        return Passpack.utils.hashx(password + Passpack.utils.hashx(password, true, true), true, true);
    }

    public decryptCredential(credential: ICredential, masterKey: string, excludes: string[]) {
        return this.crypt(Passpack.decode, credential, masterKey, excludes);
    }

    public decryptCredentials(credentials: ICredential[], masterKey: string, excludes: string[]) {
        return credentials.map(item => this.decryptCredential(item, masterKey, excludes));
    }

    public encryptCredential(credential: ICredential, masterKey: string, excludes: string[]) {
        return this.crypt(Passpack.encode, credential, masterKey, excludes);
    }

    public encryptCredentials(credentials: ICredential[], masterKey: string, excludes: string[]) {
        return credentials.map(item => this.encryptCredential(item, masterKey, excludes));
    }

    /**
     * Encrypt/decrypt the properties of an object literal using Passpack.
     * @param {IPasspackCryptoFunction} action - The Passpack function to use for encryption/decryption
     * @param {any} obj - The object literal to be encrypted/decrypted
     * @param {string} masterKey - A Passpack master key
     * @param {string[]} excludes - An array of object property names whose values should not be encrypted
     * @returns {Credential}
     */
    private crypt(action: PasspackCryptoFunction, obj: any, masterKey: string, excludes: string[]) {
        const newCredential: any = {};
        Object.keys(obj).forEach((k: string) => {
            if (excludes.indexOf(k) === -1) {
                newCredential[k] = action('AES', obj[k], this.base64ToUtf8(masterKey));
            } else {
                newCredential[k] = obj[k];
            }
        });
        return newCredential;
    }
}
