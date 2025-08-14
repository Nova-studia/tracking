module.exports = {

"[project]/.next-internal/server/app/api/contracts/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

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
"[project]/src/models/Contract.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const ContractSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["Schema"]({
    phone_number: {
        type: String,
        required: true,
        trim: true
    },
    lot_number: {
        type: String,
        required: true,
        length: 8,
        uppercase: true,
        trim: true
    },
    full_name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    gatepass: {
        type: String,
        required: true,
        trim: true,
        maxlength: 6,
        uppercase: true,
        validate: {
            validator: function(v) {
                return /^[A-Z0-9]*$/.test(v);
            },
            message: 'Gatepass solo puede contener letras y números'
        }
    },
    signature_data: {
        type: String,
        required: true
    },
    owner_name: {
        type: String,
        required: true,
        trim: true
    },
    owner_phone: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    ip_address: {
        type: String,
        required: false
    }
});
// Create indexes for better query performance
ContractSchema.index({
    timestamp: -1
});
ContractSchema.index({
    phone_number: 1
});
ContractSchema.index({
    lot_number: 1
}, {
    unique: true
});
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Contract || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model('Contract', ContractSchema);
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
"[project]/src/app/api/contracts/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "GET": ()=>GET,
    "POST": ()=>POST
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mongodb.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Contract$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Contract.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stream$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/stream-utils.ts [app-route] (ecmascript)");
;
;
;
;
async function POST(request) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])();
        const body = await request.json();
        const { phoneNumber, lotNumber, fullName, address, gatepass, ownerName, ownerPhone, signatureData } = body;
        console.log('📥 API received contract data:', {
            phoneNumber,
            lotNumber,
            fullName,
            address,
            gatepass: gatepass ? 'PROVIDED' : 'MISSING',
            ownerName,
            ownerPhone,
            signatureData: signatureData ? 'PROVIDED' : 'MISSING'
        });
        // Get client IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
        if (!phoneNumber || !lotNumber || !gatepass || !ownerName || !ownerPhone || !signatureData) {
            const missing = [];
            if (!phoneNumber) missing.push('phoneNumber');
            if (!lotNumber) missing.push('lotNumber');
            if (!gatepass) missing.push('gatepass');
            if (!ownerName) missing.push('ownerName');
            if (!ownerPhone) missing.push('ownerPhone');
            if (!signatureData) missing.push('signatureData');
            console.log('❌ Missing required fields:', missing);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Campos faltantes: ${missing.join(', ')}. Todos los campos son requeridos.`
            }, {
                status: 400
            });
        }
        if (lotNumber.length !== 8) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'El número de lote debe tener exactamente 8 dígitos'
            }, {
                status: 400
            });
        }
        if (gatepass.length > 6 || !/^[A-Z0-9]*$/.test(gatepass)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'El Gatepass debe tener máximo 6 caracteres alfanuméricos'
            }, {
                status: 400
            });
        }
        // Check if lot number already exists
        const existingLot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Contract$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findOne({
            lot_number: lotNumber.toUpperCase()
        });
        if (existingLot) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Este número de lote ya ha sido registrado. Por favor, verifique el número e intente con otro.'
            }, {
                status: 409
            });
        }
        // Create new contract
        const contract = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Contract$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"]({
            phone_number: phoneNumber,
            lot_number: lotNumber.toUpperCase(),
            full_name: fullName,
            address: address,
            gatepass: gatepass,
            owner_name: ownerName,
            owner_phone: ownerPhone,
            signature_data: signatureData,
            ip_address: ipAddress
        });
        const savedContract = await contract.save();
        // Notify all connected clients of the new contract
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stream$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["notifyNewContract"])();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: 'Contrato guardado exitosamente',
            contractId: savedContract._id
        });
    } catch (error) {
        console.error('Error processing request:', error);
        // Handle MongoDB duplicate key error
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000 && 'keyPattern' in error && error.keyPattern?.lot_number) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Este número de lote ya ha sido registrado. Por favor, verifique el número e intente con otro.'
            }, {
                status: 409
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Error procesando la solicitud'
        }, {
            status: 500
        });
    }
}
async function GET(request) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * limit;
        // Build search filter
        let filter = {};
        if (search) {
            filter = {
                lot_number: {
                    $regex: search.toUpperCase(),
                    $options: 'i'
                }
            };
        }
        // Get total count for pagination
        const total = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Contract$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].countDocuments(filter);
        // Get paginated results
        const contracts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Contract$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find(filter).select('_id phone_number lot_number full_name address gatepass owner_name owner_phone timestamp').sort({
            timestamp: -1
        }).skip(skip).limit(limit).lean();
        // Transform _id to id for frontend compatibility
        const transformedContracts = contracts.map((contract)=>({
                id: contract._id.toString(),
                phone_number: contract.phone_number,
                lot_number: contract.lot_number,
                full_name: contract.full_name,
                address: contract.address,
                gatepass: contract.gatepass,
                owner_name: contract.owner_name,
                owner_phone: contract.owner_phone,
                timestamp: contract.timestamp
            }));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            contracts: transformedContracts,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total
        });
    } catch (error) {
        console.error('Database error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Error interno del servidor'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__0a599c00._.js.map