import {
    base64ToUtf8,
    decryptCredential,
    decryptCredentials,
    encryptCredential,
    encryptCredentials,
    generateMasterKey,
    generatePassword,
    hash,
    isWeakPassword,
    utf8ToBase64
} from '../modules/all';
import { ICredential, IPasswordSpecification } from '../types/all';

const testMasterKey = '%sÁI@YÅG¿µA';

const testCredentialPlainText: ICredential = {
    CredentialID: '361fe91a-3dca-4871-b69e-c41c31507c8c',
    UserID: 'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
    Description: 'Test Credential',
    Username: '_testuser123',
    Password: '8{s?(\'7.171h)3H',
    Url: 'http://www.test.com?id=23&param=TEST+VALUE',
    UserDefined1Label: 'Custom 1',
    UserDefined1: 'CUSTOM1',
    UserDefined2Label: 'Custom 2',
    UserDefined2: 'CUSTOM2',
    Notes: 'Test Notes:\n\nThese are test notes.',
    PwdOptions: '16|1|1|1|1'
};

const testCredentialEncrypted: ICredential = {
    CredentialID: '361fe91a-3dca-4871-b69e-c41c31507c8c',
    UserID: 'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
    Description: 'EcOPw4TDj0gBITAhITAhLSExMCFQITEwIWJHQcK9wpJtXHQgRMKtaw==',
    Username: 'EsOPw4TDj0gBITAhITAhLcKHw7LChcOKwpUHbsOIw60iYXs=',
    Password: 'E8OPw4TDj0gBITAhITAhLUnDiMKTVMOrfk0hMCEhMzMhwoHCozx3w5AI',
    Url: 'E8OPw4TDj0gBITAhITAhLRnDh8KUG8O5dlVZZ8OBwrwgO8KQNDctecKbM8KGworDmzoUbsOrSEnCrMKSDyMtNkhZw6/Cgyp5ZSExMiEG',
    UserDefined1Label: 'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmM=',
    UserDefined1: 'FMOPw4TDj0gBITAhITAhLW88TTrDrEXDvw==',
    UserDefined2Label: 'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmA=',
    UserDefined2: 'FcOPw4TDj0gBITAhITAhLcOeJDjCncKcw47DqA==',
    Notes: 'FcOPw4TDj0gBITAhITAhLcOJFBjCvcOzw43CtVxmwoJzw4pAw63CpcKRLSkDwpg5LiE0NSHCmwNTajjCmVbCtMKAwq0tw43CvQ==',
    PwdOptions: '16|1|1|1|1'
};

function checkEncryption(credential: ICredential, masterKeyPlainText: string) {
    expect(credential.CredentialID).toBe('361fe91a-3dca-4871-b69e-c41c31507c8c');
    expect(credential.UserID).toBe('ef0ee37f-2ace-417c-b30d-ccfaf4450906');
    expect(Passpack.decode('AES', credential.Description, masterKeyPlainText)).toBe('Test Credential');
    expect(Passpack.decode('AES', credential.Username, masterKeyPlainText)).toBe('_testuser123');
    expect(Passpack.decode('AES', credential.Password, masterKeyPlainText)).toBe('8{s?(\'7.171h)3H');
    expect(Passpack.decode('AES', credential.Url, masterKeyPlainText)).toBe('http://www.test.com?id=23&param=TEST+VALUE');
    expect(Passpack.decode('AES', credential.UserDefined1, masterKeyPlainText)).toBe('CUSTOM1');
    expect(Passpack.decode('AES', credential.UserDefined1Label, masterKeyPlainText)).toBe('Custom 1');
    expect(Passpack.decode('AES', credential.UserDefined2, masterKeyPlainText)).toBe('CUSTOM2');
    expect(Passpack.decode('AES', credential.UserDefined2Label, masterKeyPlainText)).toBe('Custom 2');
    expect(Passpack.decode('AES', credential.Notes, masterKeyPlainText)).toBe('Test Notes:\n\nThese are test notes.');
}

function checkDecryption(credential: ICredential) {
    expect(credential.CredentialID).toBe('361fe91a-3dca-4871-b69e-c41c31507c8c');
    expect(credential.UserID).toBe('ef0ee37f-2ace-417c-b30d-ccfaf4450906');
    expect(credential.Description).toBe('Test Credential');
    expect(credential.Username).toBe('_testuser123');
    expect(credential.Password).toBe('8{s?(\'7.171h)3H');
    expect(credential.Url).toBe('http://www.test.com?id=23&param=TEST+VALUE');
    expect(credential.UserDefined1).toBe('CUSTOM1');
    expect(credential.UserDefined1Label).toBe('Custom 1');
    expect(credential.UserDefined2).toBe('CUSTOM2');
    expect(credential.UserDefined2Label).toBe('Custom 2');
    expect(credential.Notes).toBe('Test Notes:\n\nThese are test notes.');
}

describe('Cryptography', () => {

    test('base64ToUtf8', () => {
        const utf8 = base64ToUtf8('VEVTVA==');
        expect(utf8).toBe('TEST');
    });

    test('utf8ToBase64', () => {
        const b64 = utf8ToBase64('TEST');
        expect(b64).toBe('VEVTVA==');
    });

    test('decryptCredential', () => {
        const decrypted = decryptCredential(testCredentialEncrypted, testMasterKey, ['CredentialID', 'UserID']);
        checkDecryption(decrypted);
    });

    test('decryptCredentials', () => {
        const credentials = [testCredentialEncrypted, testCredentialEncrypted];
        const decrypted = decryptCredentials(credentials, testMasterKey, ['CredentialID', 'UserID']);
        decrypted.forEach(c => checkDecryption(c));
    });

    test('encryptCredential', () => {
        const encrypted = encryptCredential(testCredentialPlainText, testMasterKey, ['CredentialID', 'UserID']);
        checkEncryption(encrypted, testMasterKey);
    });

    test('encryptCredentials', () => {
        const credentials = [testCredentialPlainText, testCredentialPlainText];
        const encrypted = encryptCredentials(credentials, testMasterKey, ['CredentialID', 'UserID']);
        encrypted.forEach(c => checkEncryption(c, testMasterKey));
    });

    test('generateMasterKey', () => {
        const k = Passpack.utils.hashx('test123' + Passpack.utils.hashx('test123', true, true), true, true);
        expect(k).toBe(generateMasterKey('test123'));
    });

    test('generatePassword', () => {
        const spec: IPasswordSpecification = {
            length: 0,
            lowercase: false,
            uppercase: false,
            numbers: false,
            symbols: false
        };

        const empty = generatePassword(spec);
        spec.length = 32;
        const empty2 = generatePassword(spec);
        expect(empty).toBe(null);
        expect(empty2).toBe(null);

        spec.lowercase = true;
        const lc = generatePassword(spec);
        expect(lc.toLowerCase()).toBe(lc);

        spec.lowercase = false;
        spec.uppercase = true;
        const uc = generatePassword(spec);
        expect(uc.toUpperCase()).toBe(uc);

        spec.uppercase = false;
        spec.numbers = true;
        const nums = generatePassword(spec);
        expect(nums.match(/\d+/gi));

        spec.numbers = false;
        spec.symbols = true;
        const sym = generatePassword(spec);
        expect(sym.match(/[^a-z0-9]+/gi));
    });

    test('hash', () => {
        expect(hash('test123')).toBe('ec18d133a93a4098adf0c17027025375');
    });

    test('isWeakPassword', () => {
        expect(isWeakPassword(null)).toBe(true);
        expect(isWeakPassword('')).toBe(true);
        expect(isWeakPassword('pass123')).toBe(true);
        expect(isWeakPassword('dhk2J*jsjk')).toBe(false);
    });

});
