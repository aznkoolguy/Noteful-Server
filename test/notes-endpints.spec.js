const knex = require('knex');
const app = require('../src/app')
const { makeFoldersArray } = require('./folders.fixtures')
const { makeNotesArray } = require('./notes.fixtures')

describe.only('Notes Endpoints', function() {

    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    });

    after('disconnect from db', () => db.destroy());
    before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))
    afterEach('cleanup',() => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    describe(`Get /api/notes`, () => {

        context('Given no notes', () => {
            
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/notes')
                    .expect(200, [])
            })
        })

        context('Given there are notes in the database', () => {
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes)
                    })
            })

            it(`responds with 200 and all of the notes`, () => {
                return supertest(app)
                    .get('/api/notes')
                    .expect(200, testNotes)
            })
        })

    })


    describe(`Get /api/notes/:note_id`, () => {

        context('Given no notes', () => {

            it('responds with 404', () => {
                const noteId = 123456;
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            })

        })

        context('Given there are notes in the database', () => {

            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes)
                    })
            })

            it(`responds with 200 and the specified note`, () => {
                const noteId = 2;
                const expectedNote = testNotes[noteId - 1]
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(200, expectedNote)
            })

        })

    })


    describe(`POST /api/notes`, () => {
    
        const testFolders = makeFoldersArray()

        beforeEach('insert folders', () => {
            return db
                .into('noteful_folders')
                .insert(testFolders)
        })

        it(`creates a note, responding with 201 and new note`, function() {
            this.retries(3)

            const newNote = {
                name: 'Test new note',
                content: 'Test new content ....',
                folder_id: 2
            }

            return supertest(app)
                .post('/api/notes')
                .send(newNote)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newNote.name)
                    expect(res.body.content).to.eql(newNote.content)
                    expect(res.body.folder_id).to.eql(newNote.folder_id)
                    expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
                    const expectedDate = new Date().toLocaleString()
                    const actualDate = new Date(res.body.modified).toLocaleString()
                    expect(actualDate).to.eql(expectedDate)
                })
                .expect(postRes =>
                    db
                        .from('noteful_notes')
                        .select('*')
                        .where({ id: postRes.body.id })
                        .first()
                        .then(row => {
                            expect(row.name).to.eql(newNote.name)
                            expect(row.content).to.eql(newNote.content)
                            expect(row.folder_id).to.eql(newNote.folder_id)
                            const expectedDate = new Date().toLocaleString()
                            const actualDate = new Date(row.modified).toLocaleString()
                            expect(actualDate).to.eql(expectedDate)

                        })
                    
                )
        })

        // const requireFields = ['name', 'content', 'folder_id']

        // requireFields.forEach(field => {
        //     const newNote = {
        //         name: 'Test new note',
        //         content: 'test content ....',
        //         modified: new Date(),
        //         folder_id: 2,
        //     }
        //     it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        //         delete newNote[field]

        //         return supertest(app)
        //             .post('/api/notes')
        //             .send(newNote)
        //             .expect(400, {
        //                 error: {
        //                     message: `Missing '${field}' in request body`
        //                 }
        //             })
        //     })

        // })
    })


    describe(`DELETE /api/notes/:note_id`, () => {

        context('Given no notes', () => {

            it(`responds with 404`, () => {

                const noteId = 123456;

                return supertest(app)
                    .delete(`/api/notes/${noteId}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            })
        })

        context('Given there are notes in the database', () => {

            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(() => {
                    return db
                        .into('noteful_notes')
                        .insert(testNotes)
                })
                
                
            })

            it(`responds with 204 and removes the note`, () => {

                const idToRemove = 2;
                const expectedNotes = testNotes.filter(note => note.id !== idToRemove)

                return supertest(app)
                    .delete(`/api/notes/${idToRemove}`)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get('/api/notes')
                            .expect(expectedNotes)
                    )

            })

        })

    })


    describe(`PATCH /api/notes/:note_id`, () => {

        context(`Given no notes`, () => {
            
            it(`responds with 404`, () => {
                const noteId = 123456;

                return supertest(app)
                    .patch(`/api/notes/${noteId}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            })

        })

        context(`Given there are notes in the database`, () => {

            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(() => {
                    return db
                        .into('noteful_notes')
                        .insert(testNotes)
                })
            })

            it(`responds with 204 and updates the note`, () => {

                const idToUpdate = 2

                const updateNote = {
                    name: 'Updated note name'
                }

                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                }

                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send(updateNote)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                        .get(`/api/notes/${idToUpdate}`)
                        .expect(expectedNote)    
                    )
                
            })

            it(`responds with 400 when no required fields supplied`, () => {

                const idToUpdate = 2

                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: {
                            message: `Request body must contain 'name', 'modified', 'folder_id', or 'content'`
                        }
                    })
            })

            it(`responds with 204 when updating only a subset of fields`, () => {

                const idToUpdate = 2

                const updateNote = {
                    name: 'Updated Note Name',
                }

                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote

                }

                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send({
                        ...updateNote,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .expect(expectedNote)    
                    )

            })

        })

    })



})
