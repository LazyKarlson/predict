import fs from 'fs';
import path from 'path';
import db from './database';

async function migrate() {
    try {
        console.log('Starting database migration...');
        
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        
        // Разделяем SQL на отдельные команды
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        for (const statement of statements) {
            await db.query(statement);
        }
        
        console.log('✅ Database migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();

