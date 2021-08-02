const FoldersService = {
    getAllFolders(knex) {
      return knex
        .select('*')
        .from('noteful_folders')
    },
  
    getById(knex, id) {
      return knex
        .select('*')
        .from('noteful_folders')
        .where({ id })
        .first()
    },
  
    insertFolder(knex, data) {
      return knex
        .insert(data)
        .into('noteful_folders')
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },
  
    deleteFolder(knex, id) {
      return knex('noteful_folders')
        .where( { id })
        .delete()
    }
  }
  
  module.exports = FoldersService
