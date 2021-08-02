const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app')
const { makeFoldersArray } = require('./folders.fixtures')

describe('Folders Endpoints', function() {

    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    });
    
    before('truncate tables', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))
    
    after('disconnect from db', () => db.destroy());
    
    afterEach('clean tables',() => db.raw('TRUNCATE  noteful_notes, noteful_folders RESTART IDENTITY CASCADE'))


    describe(`Get /api/folders`, () => {

        context('Given no folders', () => {
            
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, [])
            })
        })

        context('Given there are folders in the database', () => {

            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it(`responds with 200 and all of the folders`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            })
        })

    })


    describe(`Get /api/folders/:folder_id`, () => {

        context('Given no folders', () => {

            it('responds with 404', () => {

                const folder_id = 123456;

                return supertest(app)
                    .get(`/api/folders/${folder_id}`)
                    .expect(404, { 
                        error: { 
                            message: `Folder doesn't exist` 
                        } 
                    })
            })

        })

        context('Given there are folders in the database', () => {

            const testFolders = makeFoldersArray()

            beforeEach('insert tables', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it(`responds with 200 and the specified folder`, () => {

                const folder_id = 2;
                const expectedFolder = testFolders[folder_id - 1]

                return supertest(app)
                    .get(`/api/folders/${folder_id}`)
                    .expect(200, expectedFolder)
            })

        })


    })


    describe(`POST /api/folders`, () => {

        it(`creates a folder, responding with 201 and new folder`, function() {

            this.retries(3)

            const newFolder = {
                name: 'Test new folder'
            }

            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newFolder.name)
                })
                .then(postRes =>
                    supertest(app)
                        .get(`/api/folders/${postRes.body.id}`)
                        .expect(postRes.body)    
                )
        })

        it('should respond with 400 if required fields not provided', () => {
            const newFolder ={
              id: 3
            }
            return supertest(app)
              .post('/api/folders')
              .send(newFolder)
              .set({
                'content-type': 'application/json'
              })
              .expect(400, {
                error: { message: 'Name is required' }
              })
          })
        

    })


    describe(`DELETE /api/folders/:folder_id`, () => {

        context('Given no folders', () => {

            it(`responds with 404`, () => {

                const folder_id = 123456;

                return supertest(app)
                    .delete(`/api/folders/${folder_id}`)
                    .expect(404, { 
                        error: {
                            message: `Folder doesn't exist` 
                        } 
                    })
            })
        })

        context('Given there are folders in the database', () => {

            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .insert(testFolders)
                    .into('noteful_folders')
            })

            it(`responds with 204 and removes the folder`, () => {
               
                const idToRemove = 1;
                
                const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove)

                return supertest(app)
                    .delete(`/api/folders/${idToRemove}`)
                    .expect(204)
                    .then(() => 
                        supertest(app)
                            .get('/api/folders')
                            .expect(expectedFolders)
                    )

            })

        })

    })
})
