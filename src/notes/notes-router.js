const path = require('path')
const express = require('express')
const xss = require('xss')

const NotesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNote = note => ({
    id: note.id,
    name: xss(note.name),
    modified: note.modified,
    folder_id: note.folder_id,
    content: xss(note.content),
})

notesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes.map(serializeNote))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { name, modified, folder_id, content } = req.body
        const newNote = { name, folder_id, content }

        for(const [key, value] of Object.entries(newNote)) {
            if(value === null) {
                res.status(400).json({
                    error: {
                        message: `Missing '${key}' in request body`
                    }
                })
            }
        }

        newNote.modified = modified
        const knexInstance = req.app.get('db')

        NotesService.insertNote(
            knexInstance,
            newNote
        )
            .then(note => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${note.id}`))
                    .json(serializeNote(note))
            })
            .catch(next)

    })

notesRouter
    .route('/:id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        const idToGet = req.params.id

        NotesService.getById(
            knexInstance,
            idToGet
        )
            .then(note => {
                if(!note) {
                    return res.status(404).json({
                        error: {
                            message: `Note doesn't exist`
                        }
                    })
                }
                res.note = note
                next()
            })
            .catch(next)

    })
    .get((req, res, next) => {
        res.json(serializeNote(res.note))

    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        const idToDelete = req.params.id

        NotesService.deleteNote(
            knexInstance,
            idToDelete
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)

    })
    .patch(jsonParser, (req, res, next) => {
        const { name, modified, folder_id, content } = req.body
        const noteToUpdate = { name, modified, folder_id, content }

        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
        if(numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain 'name', 'modified', 'folder_id', or 'content'`
                }
            })
        }

        const knexInstance = req.app.get('db')
        const idToUpdate = req.params.id

        NotesService.updateNote(
            knexInstance,
            idToUpdate,
            noteToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)

    })



module.exports = notesRouter;
