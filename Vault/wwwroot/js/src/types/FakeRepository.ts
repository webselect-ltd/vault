import { ICredential, ICredentialSummary, IRepository, ITag, ITagIndex } from './all';

export class FakeRepository implements IRepository {
    public credentials: ICredential[];

    constructor() {
        this.credentials = [{
            credentialID: 'cr1',
            userID: 'user1',
            description: 'Cat',
            username: 'cat',
            password: 'cat123',
            url: 'http://cat.com',
            userDefined1Label: 'Cat UD 1',
            userDefined1: 'catud1',
            userDefined2Label: 'Cat UD 1',
            userDefined2: 'catud1',
            notes: 'Cat notes',
            pwdOptions: '12|1|1|1|1',
            tagIDs: 'cat'
        }, {
            credentialID: 'cr2',
            userID: 'user1',
            description: 'Dog',
            username: 'dog',
            password: 'dog123',
            url: 'http://dog.com',
            userDefined1Label: 'Dog UD 1',
            userDefined1: 'dogud1',
            userDefined2Label: 'Dog UD 1',
            userDefined2: 'dogud1',
            notes: 'Dog notes',
            pwdOptions: '12|1|1|1|1',
            tagIDs: 'dog'
        }, {
            credentialID: 'cr3',
            userID: 'user1',
            description: 'Fish',
            username: 'fish',
            password: 'fish123',
            url: 'http://fish.com',
            userDefined1Label: 'Fish UD 1',
            userDefined1: 'fishud1',
            userDefined2Label: 'Fish UD 1',
            userDefined2: 'fishud1',
            notes: 'Fish notes',
            pwdOptions: '12|1|1|1|1',
            tagIDs: 'fish'
        }, {
            credentialID: 'cr4',
            userID: 'user1',
            description: 'Catfish',
            username: 'catfish',
            password: 'catfish123',
            url: 'http://catfish.com',
            userDefined1Label: 'Catfish UD 1',
            userDefined1: 'catfishud1',
            userDefined2Label: 'Catfish UD 1',
            userDefined2: 'catfishud1',
            notes: 'Catfish notes',
            pwdOptions: '12|1|1|1|1',
            tagIDs: 'cat|fish'
        }, {
            credentialID: 'cr5',
            userID: 'user1',
            description: 'Dogfish',
            username: 'dogfish',
            password: 'dogfish123',
            url: 'http://dogfish.com',
            userDefined1Label: 'Dogfish UD 1',
            userDefined1: 'dogfishud1',
            userDefined2Label: 'Dogfish UD 1',
            userDefined2: 'dogfishud1',
            notes: 'Dogfish notes',
            pwdOptions: '12|1|1|1|1',
            tagIDs: 'dog|fish'
        }, {
            credentialID: 'cr6',
            userID: 'user1',
            description: 'Owl',
            username: 'owl',
            password: '_nT:NP?uovID8,TE',
            url: 'http://owl.com',
            userDefined1Label: 'Owl UD 1',
            userDefined1: 'owlud1',
            userDefined2Label: 'Owl UD 1',
            userDefined2: 'owlud1',
            notes: 'Owl notes',
            pwdOptions: '12|1|1|1|1',
            tagIDs: ''
        }];
    }

    public async login(username: string, password: string) {
        return { userID: 'user1', success: true };
    }

    public async loginDelegated(username: string, token: string) {
        return { userID: 'user1', success: true };
    }

    public async loadTagIndex() {
        const map = new Map();

        map.set('cat', ['cr1', 'cr4']);
        map.set('dog', ['cr2', 'cr5']);
        map.set('fish', ['cr3', 'cr4', 'cr5']);

        const testTagIndex: ITagIndex = {
            tags: [
                { tagID: 'cat', label: 'Cat' },
                { tagID: 'dog', label: 'Dog' },
                { tagID: 'fish', label: 'Fish' }
            ],
            index: map
        };

        return new Promise<ITagIndex>(resolve => resolve(testTagIndex));
    }

    // TODO: NOT IMPLEMENTED
    public async createTag(tag: ITag) {
        return Promise.resolve({ tagID: null, label: '' });
    }

    // TODO: NOT IMPLEMENTED
    public async deleteTags(tags: ITag[]) {
        return Promise.resolve();
    }

    public async loadCredential(credentialID: string) {
        return this.credentials.filter(c => c.credentialID === credentialID)[0];
    }

    public async loadCredentialSummaryList() {
        return this.credentials.map(c => ({
            credentialID: c.credentialID,
            description: c.description,
            username: c.username,
            password: c.password,
            url: c.url
        } as ICredentialSummary));
    }

    public async loadCredentials() {
        return this.credentials;
    }

    public async createCredential(credential: ICredential) {
        return new Promise<ICredential>(resolve => resolve(credential));
    }

    public async updateCredential(credential: ICredential) {
        return new Promise<ICredential>(resolve => resolve(credential));
    }

    public async updatePassword(newPassword: string) {
        return new Promise<void>(resolve => resolve());
    }

    public async import(credentials: ICredential[]) {
        this.credentials = credentials;
        return new Promise<void>(resolve => resolve());
    }

    public async deleteCredential(credentialID: string) {
        this.credentials = this.credentials.filter(c => c.credentialID !== credentialID);
        return new Promise<void>(resolve => resolve());
    }
}
