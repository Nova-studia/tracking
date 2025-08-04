module.exports = {

"[project]/.next-internal/server/app/api/db-discover/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/mongoose [external] (mongoose, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
}}),
"[project]/src/app/api/db-discover/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "GET": ()=>GET
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
;
async function GET() {
    try {
        console.log('🔍 Discovering all databases in cluster...');
        const baseUri = process.env.MONGODB_URI?.replace(/\/[^\/]*\?/, '/?') || '';
        console.log('🔗 Connecting to admin database...');
        const connection = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].createConnection(baseUri);
        const admin = connection.db.admin();
        // List all databases
        const { databases } = await admin.listDatabases();
        console.log(`📊 Found ${databases.length} databases`);
        const results = [];
        const targetLots = [
            '98879846',
            'JDIDBFJF',
            '65654654'
        ];
        for (const dbInfo of databases){
            try {
                console.log(`🔍 Checking database: ${dbInfo.name}`);
                const db = connection.useDb(dbInfo.name);
                // List collections in this database
                const collections = await db.listCollections().toArray();
                const dbResult = {
                    name: dbInfo.name,
                    sizeOnDisk: dbInfo.sizeOnDisk,
                    collections: []
                };
                for (const colInfo of collections){
                    try {
                        const collection = db.collection(colInfo.name);
                        const count = await collection.countDocuments();
                        let hasTargetLots = false;
                        let sampleDocs = [];
                        if (count > 0) {
                            // Check if this collection has our target lots
                            const targetCheck = await collection.find({
                                lot_number: {
                                    $in: targetLots
                                }
                            }).limit(3).toArray();
                            hasTargetLots = targetCheck.length > 0;
                            // Get sample documents
                            sampleDocs = await collection.find({}).project({
                                lot_number: 1,
                                full_name: 1,
                                timestamp: 1,
                                _id: 0
                            }).sort({
                                timestamp: -1
                            }).limit(5).toArray();
                        }
                        dbResult.collections.push({
                            name: colInfo.name,
                            count,
                            hasTargetLots,
                            sampleDocs
                        });
                        if (hasTargetLots) {
                            console.log(`🎯 FOUND TARGET LOTS in ${dbInfo.name}.${colInfo.name}!`);
                        }
                    } catch (colError) {
                        console.log(`❌ Error checking collection ${colInfo.name}:`, colError);
                    }
                }
                results.push(dbResult);
            } catch (dbError) {
                console.log(`❌ Error checking database ${dbInfo.name}:`, dbError);
                results.push({
                    name: dbInfo.name,
                    error: dbError instanceof Error ? dbError.message : 'Unknown error'
                });
            }
        }
        await connection.close();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            targetLots,
            totalDatabases: databases.length,
            results: results.filter((r)=>!('error' in r) && r.collections.length > 0)
        });
    } catch (error) {
        console.error('❌ Discovery failed:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__52febe38._.js.map