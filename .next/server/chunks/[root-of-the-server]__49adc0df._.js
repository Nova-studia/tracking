module.exports = {

"[project]/.next-internal/server/app/api/contracts/stream/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

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
"[externals]/mongoose [external] (mongoose, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
}}),
"[project]/src/lib/mongodb.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}
let cached = ("TURBOPACK ident replacement", globalThis).mongoose;
if (!cached) {
    cached = ("TURBOPACK ident replacement", globalThis).mongoose = {
        conn: null,
        promise: null
    };
}
async function connectDB() {
    // If already connected, return cached connection
    if (cached?.conn) {
        console.log('🔄 Using cached MongoDB connection');
        return cached.conn;
    }
    // If no promise exists, create one
    if (!cached?.promise) {
        console.log('🔌 Connecting to MongoDB...');
        console.log('🌍 Environment:', ("TURBOPACK compile-time value", "development"));
        console.log('🔗 MongoDB URI:', MONGODB_URI?.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        };
        if (cached) {
            cached.promise = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(MONGODB_URI, opts).then((mongoose)=>{
                console.log('✅ MongoDB connected successfully');
                console.log('📊 Database name:', mongoose.connection.name);
                return mongoose;
            });
        }
    }
    try {
        if (cached) {
            cached.conn = await cached.promise;
        }
    } catch (e) {
        console.error('❌ MongoDB connection failed:', e);
        if (cached) {
            cached.promise = null;
        }
        throw e;
    }
    return cached?.conn;
}
// Handle connection events
__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection.on('connected', ()=>{
    console.log('🟢 Mongoose connected to MongoDB');
});
__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection.on('error', (err)=>{
    console.error('🔴 Mongoose connection error:', err);
});
__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection.on('disconnected', ()=>{
    console.log('🟡 Mongoose disconnected from MongoDB');
});
const __TURBOPACK__default__export__ = connectDB;
}),
"[project]/src/lib/stream-utils.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "addClient": ()=>addClient,
    "notifyClients": ()=>notifyClients,
    "notifyNewContract": ()=>notifyNewContract,
    "removeClient": ()=>removeClient,
    "sendUpdate": ()=>sendUpdate
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mongodb.ts [app-route] (ecmascript)");
;
// Array to store active SSE connections
let clients = [];
// Function to send updates to a specific client
async function sendUpdate(controller) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])();
        const Contract = (await __turbopack_context__.r("[project]/src/models/Contract.ts [app-route] (ecmascript, async loader)")(__turbopack_context__.i)).default;
        const contracts = await Contract.find().sort({
            createdAt: -1
        });
        const transformedContracts = contracts.map((contract)=>({
                id: contract._id.toString(),
                phone_number: contract.phone_number,
                lot_number: contract.lot_number,
                equipment_number: contract.equipment_number,
                equipment_type: contract.equipment_type,
                freight_rate: contract.freight_rate,
                type_of_service: contract.type_of_service,
                total_value: contract.total_value,
                contract_status: contract.contract_status,
                date: contract.date,
                truck_driver: contract.truck_driver,
                createdAt: contract.createdAt,
                updatedAt: contract.updatedAt,
                signatureData: contract.signatureData
            }));
        controller.enqueue(`data: ${JSON.stringify({
            type: 'contracts',
            data: transformedContracts
        })}\n\n`);
    } catch (error) {
        console.error('Error sending update:', error);
    }
}
function notifyClients() {
    clients.forEach((client)=>{
        try {
            sendUpdate(client.controller);
        } catch  {
            // Remove failed client
            clients = clients.filter((c)=>c.id !== client.id);
        }
    });
}
function notifyNewContract() {
    clients.forEach((client)=>{
        try {
            client.controller.enqueue(`data: ${JSON.stringify({
                type: 'new_contract'
            })}\n\n`);
        } catch  {
            // Remove failed client
            clients = clients.filter((c)=>c.id !== client.id);
        }
    });
}
function addClient(client) {
    clients.push(client);
}
function removeClient(clientId) {
    clients = clients.filter((client)=>client.id !== clientId);
}
;
}),
"[project]/src/app/api/contracts/stream/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "GET": ()=>GET
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stream$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/stream-utils.ts [app-route] (ecmascript)");
;
async function GET(request) {
    const clientId = Math.random().toString(36).substring(7);
    const stream = new ReadableStream({
        start (controller) {
            // Add client to the list
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stream$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addClient"])({
                id: clientId,
                controller
            });
            // Send initial data
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stream$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sendUpdate"])(controller);
            // Keep connection alive with heartbeat
            const heartbeat = setInterval(()=>{
                try {
                    controller.enqueue(`data: {"type":"heartbeat"}\n\n`);
                } catch  {
                    clearInterval(heartbeat);
                }
            }, 30000);
            // Cleanup on disconnect
            request.signal.addEventListener('abort', ()=>{
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stream$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["removeClient"])(clientId);
                clearInterval(heartbeat);
                try {
                    controller.close();
                } catch  {
                // Connection already closed
                }
            });
        }
    });
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        }
    });
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__49adc0df._.js.map