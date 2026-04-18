use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::PathBuf,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

pub struct AppDb {
    conn: Mutex<Connection>,
    path: PathBuf,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseStatus {
    path: String,
    schema_version: i64,
    customer_count: i64,
    service_count: i64,
    order_count: i64,
    payment_count: i64,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomerRecord {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub business: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomerInput {
    pub id: Option<String>,
    pub name: String,
    pub phone: String,
    pub business: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceRecord {
    pub id: String,
    pub label: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceInput {
    pub id: Option<String>,
    pub label: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentRecord {
    pub id: String,
    pub amount: f64,
    pub date: String,
    pub note: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderRecord {
    pub id: String,
    pub order_number: i64,
    pub customer_id: String,
    pub customer_name: String,
    pub phone: String,
    pub service_type: String,
    pub description: String,
    pub dimensions: Option<String>,
    pub quantity: i64,
    pub notes: Option<String>,
    pub assigned_designer: Option<String>,
    pub assigned_printer: Option<String>,
    pub assigned_installer: Option<String>,
    pub total_price: f64,
    pub deposit: f64,
    pub payments: Vec<PaymentRecord>,
    pub paid_amount: f64,
    pub remaining_amount: f64,
    pub payment_status: String,
    pub delivery_date: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderInput {
    pub customer_name: String,
    pub phone: String,
    pub service_type: String,
    pub description: String,
    pub dimensions: Option<String>,
    pub quantity: Option<i64>,
    pub notes: Option<String>,
    pub assigned_designer: Option<String>,
    pub assigned_printer: Option<String>,
    pub assigned_installer: Option<String>,
    pub total_price: f64,
    pub deposit: Option<f64>,
    pub delivery_date: String,
    pub status: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentInput {
    pub amount: f64,
    pub note: Option<String>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupData {
    pub format_version: i64,
    pub app_version: String,
    pub exported_at: String,
    pub settings: Vec<BackupSetting>,
    pub customers: Vec<BackupCustomer>,
    pub services: Vec<BackupService>,
    pub orders: Vec<BackupOrder>,
    pub payments: Vec<BackupPayment>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupSetting {
    pub key: String,
    pub value: String,
    pub updated_at: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupCustomer {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub business: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupService {
    pub id: String,
    pub label: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupOrder {
    pub id: String,
    pub order_number: i64,
    pub customer_id: String,
    pub customer_name_snapshot: String,
    pub customer_phone_snapshot: String,
    pub service_id: String,
    pub description: String,
    pub dimensions: Option<String>,
    pub quantity: i64,
    pub notes: Option<String>,
    pub assigned_designer: Option<String>,
    pub assigned_printer: Option<String>,
    pub assigned_installer: Option<String>,
    pub total_price: f64,
    pub deposit: f64,
    pub delivery_date: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupPayment {
    pub id: String,
    pub order_id: String,
    pub amount: f64,
    pub paid_at: String,
    pub note: Option<String>,
    pub created_at: String,
}

pub fn init(app: &AppHandle) -> Result<AppDb, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    fs::create_dir_all(&app_data_dir).map_err(|err| err.to_string())?;

    let path = app_data_dir.join("saham-print.sqlite3");
    let conn = Connection::open(&path).map_err(|err| err.to_string())?;
    migrate(&conn)?;

    Ok(AppDb {
        conn: Mutex::new(conn),
        path,
    })
}

fn migrate(conn: &Connection) -> Result<(), String> {
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|err| err.to_string())?;

    let current_version: i64 = conn
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .map_err(|err| err.to_string())?;

    if current_version == 0 {
        conn.execute_batch(SCHEMA_V1)
            .map_err(|err| err.to_string())?;
        seed_default_services(conn)?;
        conn.pragma_update(None, "user_version", 1)
            .map_err(|err| err.to_string())?;
    }

    Ok(())
}

fn seed_default_services(conn: &Connection) -> Result<(), String> {
    let services = [
        ("printing", "طباعة"),
        ("tshirts", "تيشيرتات"),
        ("banners", "بنرات"),
        ("cups", "أكواب"),
        ("stickers", "ستيكرات"),
        ("cards", "كروت"),
        ("other", "أخرى"),
    ];

    for (id, label) in services {
        conn.execute(
            "INSERT OR IGNORE INTO services (id, label) VALUES (?1, ?2)",
            params![id, label],
        )
        .map_err(|err| err.to_string())?;
    }

    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('next_order_number', '1001')",
        [],
    )
    .map_err(|err| err.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn database_status(db: tauri::State<'_, AppDb>) -> Result<DatabaseStatus, String> {
    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    database_status_from_conn(&conn, &db.path)
}

#[tauri::command]
pub fn db_list_customers(db: tauri::State<'_, AppDb>) -> Result<Vec<CustomerRecord>, String> {
    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    list_customers(&conn)
}

#[tauri::command]
pub fn db_add_customer(
    input: CustomerInput,
    db: tauri::State<'_, AppDb>,
) -> Result<CustomerRecord, String> {
    validate_required(&input.name, "Customer name")?;
    validate_required(&input.phone, "Customer phone")?;

    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    let id = input.id.unwrap_or_else(generate_id);
    conn.execute(
        "INSERT INTO customers (id, name, phone, business, address, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            id,
            input.name.trim(),
            input.phone.trim(),
            clean_optional(input.business),
            clean_optional(input.address),
            clean_optional(input.notes)
        ],
    )
    .map_err(|err| err.to_string())?;

    get_customer_by_id(&conn, &id)?.ok_or_else(|| "Customer was not saved".to_string())
}

#[tauri::command]
pub fn db_update_customer(
    id: String,
    input: CustomerInput,
    db: tauri::State<'_, AppDb>,
) -> Result<CustomerRecord, String> {
    validate_required(&input.name, "Customer name")?;
    validate_required(&input.phone, "Customer phone")?;

    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    conn.execute(
        "UPDATE customers
         SET name = ?1, phone = ?2, business = ?3, address = ?4, notes = ?5, updated_at = datetime('now')
         WHERE id = ?6",
        params![
            input.name.trim(),
            input.phone.trim(),
            clean_optional(input.business),
            clean_optional(input.address),
            clean_optional(input.notes),
            id
        ],
    )
    .map_err(|err| err.to_string())?;

    get_customer_by_id(&conn, &id)?.ok_or_else(|| "Customer not found".to_string())
}

#[tauri::command]
pub fn db_delete_customer(id: String, db: tauri::State<'_, AppDb>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    conn.execute("DELETE FROM customers WHERE id = ?1", params![id])
        .map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn db_list_services(db: tauri::State<'_, AppDb>) -> Result<Vec<ServiceRecord>, String> {
    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    list_services(&conn)
}

#[tauri::command]
pub fn db_add_service(
    input: ServiceInput,
    db: tauri::State<'_, AppDb>,
) -> Result<ServiceRecord, String> {
    validate_required(&input.label, "Service label")?;

    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    let id = input.id.unwrap_or_else(generate_id);
    conn.execute(
        "INSERT INTO services (id, label) VALUES (?1, ?2)",
        params![id, input.label.trim()],
    )
    .map_err(|err| err.to_string())?;

    get_service_by_id(&conn, &id)?.ok_or_else(|| "Service was not saved".to_string())
}

#[tauri::command]
pub fn db_update_service(
    id: String,
    label: String,
    db: tauri::State<'_, AppDb>,
) -> Result<ServiceRecord, String> {
    validate_required(&label, "Service label")?;

    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    conn.execute(
        "UPDATE services SET label = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![label.trim(), id],
    )
    .map_err(|err| err.to_string())?;

    get_service_by_id(&conn, &id)?.ok_or_else(|| "Service not found".to_string())
}

#[tauri::command]
pub fn db_delete_service(id: String, db: tauri::State<'_, AppDb>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    let service_count = count_rows(&conn, "services")?;
    if service_count <= 1 {
        return Err("At least one service must remain".to_string());
    }

    conn.execute("DELETE FROM services WHERE id = ?1", params![id])
        .map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn db_list_orders(db: tauri::State<'_, AppDb>) -> Result<Vec<OrderRecord>, String> {
    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    list_orders(&conn)
}

#[tauri::command]
pub fn db_get_order(
    id: String,
    db: tauri::State<'_, AppDb>,
) -> Result<Option<OrderRecord>, String> {
    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    get_order_by_id(&conn, &id)
}

#[tauri::command]
pub fn db_add_order(input: OrderInput, db: tauri::State<'_, AppDb>) -> Result<OrderRecord, String> {
    validate_order_input(&input)?;

    let mut conn = db.conn.lock().map_err(|err| err.to_string())?;
    let tx = conn.transaction().map_err(|err| err.to_string())?;
    let customer = ensure_customer(&tx, &input.customer_name, &input.phone)?;
    let order_id = generate_id();
    let order_number = next_order_number(&tx)?;
    let deposit = input.deposit.unwrap_or(0.0);

    tx.execute(
        "INSERT INTO orders (
            id, order_number, customer_id, customer_name_snapshot, customer_phone_snapshot,
            service_id, description, dimensions, quantity, notes, assigned_designer,
            assigned_printer, assigned_installer, total_price, deposit, delivery_date, status
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
        params![
            order_id,
            order_number,
            customer.id,
            customer.name,
            customer.phone,
            input.service_type,
            input.description,
            clean_optional(input.dimensions),
            input.quantity.unwrap_or(1),
            clean_optional(input.notes),
            clean_optional(input.assigned_designer),
            clean_optional(input.assigned_printer),
            clean_optional(input.assigned_installer),
            input.total_price,
            deposit,
            input.delivery_date,
            input.status
        ],
    )
    .map_err(|err| err.to_string())?;

    if deposit > 0.0 {
        tx.execute(
            "INSERT INTO payments (id, order_id, amount, note) VALUES (?1, ?2, ?3, ?4)",
            params![generate_id(), order_id, deposit, "عربون"],
        )
        .map_err(|err| err.to_string())?;
    }

    tx.commit().map_err(|err| err.to_string())?;
    get_order_by_id(&conn, &order_id)?.ok_or_else(|| "Order was not saved".to_string())
}

#[tauri::command]
pub fn db_update_order(
    id: String,
    input: OrderInput,
    db: tauri::State<'_, AppDb>,
) -> Result<OrderRecord, String> {
    validate_order_input(&input)?;

    let mut conn = db.conn.lock().map_err(|err| err.to_string())?;
    let tx = conn.transaction().map_err(|err| err.to_string())?;
    let customer = ensure_customer(&tx, &input.customer_name, &input.phone)?;
    let paid_amount = paid_amount_for_order(&tx, &id)?;
    if paid_amount > input.total_price {
        return Err("Total price cannot be less than the paid amount".to_string());
    }

    tx.execute(
        "UPDATE orders
         SET customer_id = ?1,
             customer_name_snapshot = ?2,
             customer_phone_snapshot = ?3,
             service_id = ?4,
             description = ?5,
             dimensions = ?6,
             quantity = ?7,
             notes = ?8,
             assigned_designer = ?9,
             assigned_printer = ?10,
             assigned_installer = ?11,
             total_price = ?12,
             delivery_date = ?13,
             status = ?14,
             updated_at = datetime('now')
         WHERE id = ?15",
        params![
            customer.id,
            customer.name,
            customer.phone,
            input.service_type,
            input.description,
            clean_optional(input.dimensions),
            input.quantity.unwrap_or(1),
            clean_optional(input.notes),
            clean_optional(input.assigned_designer),
            clean_optional(input.assigned_printer),
            clean_optional(input.assigned_installer),
            input.total_price,
            input.delivery_date,
            input.status,
            id
        ],
    )
    .map_err(|err| err.to_string())?;

    tx.commit().map_err(|err| err.to_string())?;
    get_order_by_id(&conn, &id)?.ok_or_else(|| "Order not found".to_string())
}

#[tauri::command]
pub fn db_delete_order(id: String, db: tauri::State<'_, AppDb>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    conn.execute("DELETE FROM orders WHERE id = ?1", params![id])
        .map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn db_add_payment(
    order_id: String,
    input: PaymentInput,
    db: tauri::State<'_, AppDb>,
) -> Result<OrderRecord, String> {
    if input.amount <= 0.0 {
        return Err("Payment amount must be greater than zero".to_string());
    }

    let conn = db.conn.lock().map_err(|err| err.to_string())?;
    let order = get_order_by_id(&conn, &order_id)?.ok_or_else(|| "Order not found".to_string())?;
    if input.amount > order.remaining_amount {
        return Err("Payment amount cannot exceed remaining amount".to_string());
    }

    conn.execute(
        "INSERT INTO payments (id, order_id, amount, note) VALUES (?1, ?2, ?3, ?4)",
        params![
            generate_id(),
            order_id,
            input.amount,
            clean_optional(input.note)
        ],
    )
    .map_err(|err| err.to_string())?;

    get_order_by_id(&conn, &order_id)?.ok_or_else(|| "Order not found".to_string())
}

#[tauri::command]
pub fn db_export_backup(db: tauri::State<'_, AppDb>) -> Result<BackupData, String> {
    let conn = db.conn.lock().map_err(|err| err.to_string())?;

    Ok(BackupData {
        format_version: 1,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        exported_at: current_timestamp(),
        settings: list_backup_settings(&conn)?,
        customers: list_backup_customers(&conn)?,
        services: list_backup_services(&conn)?,
        orders: list_backup_orders(&conn)?,
        payments: list_backup_payments(&conn)?,
    })
}

#[tauri::command]
pub fn db_import_backup(
    backup: BackupData,
    db: tauri::State<'_, AppDb>,
) -> Result<DatabaseStatus, String> {
    validate_backup(&backup)?;

    let mut conn = db.conn.lock().map_err(|err| err.to_string())?;
    let tx = conn.transaction().map_err(|err| err.to_string())?;

    tx.execute_batch(
        "PRAGMA foreign_keys = OFF;
         DELETE FROM payments;
         DELETE FROM orders;
         DELETE FROM customers;
         DELETE FROM services;
         DELETE FROM settings;
         PRAGMA foreign_keys = ON;",
    )
    .map_err(|err| err.to_string())?;

    for setting in &backup.settings {
        tx.execute(
            "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
            params![setting.key, setting.value, setting.updated_at],
        )
        .map_err(|err| err.to_string())?;
    }

    for customer in &backup.customers {
        tx.execute(
            "INSERT INTO customers (id, name, phone, business, address, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                customer.id,
                customer.name,
                customer.phone,
                customer.business,
                customer.address,
                customer.notes,
                customer.created_at,
                customer.updated_at
            ],
        )
        .map_err(|err| err.to_string())?;
    }

    for service in &backup.services {
        tx.execute(
            "INSERT INTO services (id, label, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
            params![
                service.id,
                service.label,
                service.created_at,
                service.updated_at
            ],
        )
        .map_err(|err| err.to_string())?;
    }

    for order in &backup.orders {
        tx.execute(
            "INSERT INTO orders (
                id, order_number, customer_id, customer_name_snapshot, customer_phone_snapshot,
                service_id, description, dimensions, quantity, notes, assigned_designer,
                assigned_printer, assigned_installer, total_price, deposit, delivery_date,
                status, created_at, updated_at
             )
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
            params![
                order.id,
                order.order_number,
                order.customer_id,
                order.customer_name_snapshot,
                order.customer_phone_snapshot,
                order.service_id,
                order.description,
                order.dimensions,
                order.quantity,
                order.notes,
                order.assigned_designer,
                order.assigned_printer,
                order.assigned_installer,
                order.total_price,
                order.deposit,
                order.delivery_date,
                order.status,
                order.created_at,
                order.updated_at
            ],
        )
        .map_err(|err| err.to_string())?;
    }

    for payment in &backup.payments {
        tx.execute(
            "INSERT INTO payments (id, order_id, amount, paid_at, note, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                payment.id,
                payment.order_id,
                payment.amount,
                payment.paid_at,
                payment.note,
                payment.created_at
            ],
        )
        .map_err(|err| err.to_string())?;
    }

    ensure_next_order_number(&tx)?;
    tx.commit().map_err(|err| err.to_string())?;

    database_status_from_conn(&conn, &db.path)
}

fn count_rows(conn: &Connection, table: &str) -> Result<i64, String> {
    let sql = format!("SELECT COUNT(*) FROM {table}");
    conn.query_row(&sql, [], |row| row.get(0))
        .map_err(|err| err.to_string())
}

fn database_status_from_conn(conn: &Connection, path: &PathBuf) -> Result<DatabaseStatus, String> {
    Ok(DatabaseStatus {
        path: path.to_string_lossy().into_owned(),
        schema_version: conn
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .map_err(|err| err.to_string())?,
        customer_count: count_rows(conn, "customers")?,
        service_count: count_rows(conn, "services")?,
        order_count: count_rows(conn, "orders")?,
        payment_count: count_rows(conn, "payments")?,
    })
}

fn list_backup_settings(conn: &Connection) -> Result<Vec<BackupSetting>, String> {
    let mut stmt = conn
        .prepare("SELECT key, value, updated_at FROM settings ORDER BY key")
        .map_err(|err| err.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(BackupSetting {
                key: row.get(0)?,
                value: row.get(1)?,
                updated_at: row.get(2)?,
            })
        })
        .map_err(|err| err.to_string())?;
    collect_rows(rows)
}

fn list_backup_customers(conn: &Connection) -> Result<Vec<BackupCustomer>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, phone, business, address, notes, created_at, updated_at
             FROM customers
             ORDER BY created_at, id",
        )
        .map_err(|err| err.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(BackupCustomer {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                business: row.get(3)?,
                address: row.get(4)?,
                notes: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|err| err.to_string())?;
    collect_rows(rows)
}

fn list_backup_services(conn: &Connection) -> Result<Vec<BackupService>, String> {
    let mut stmt = conn
        .prepare("SELECT id, label, created_at, updated_at FROM services ORDER BY created_at, id")
        .map_err(|err| err.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(BackupService {
                id: row.get(0)?,
                label: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|err| err.to_string())?;
    collect_rows(rows)
}

fn list_backup_orders(conn: &Connection) -> Result<Vec<BackupOrder>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, order_number, customer_id, customer_name_snapshot,
                    customer_phone_snapshot, service_id, description, dimensions,
                    quantity, notes, assigned_designer, assigned_printer,
                    assigned_installer, total_price, deposit, delivery_date,
                    status, created_at, updated_at
             FROM orders
             ORDER BY order_number",
        )
        .map_err(|err| err.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(BackupOrder {
                id: row.get(0)?,
                order_number: row.get(1)?,
                customer_id: row.get(2)?,
                customer_name_snapshot: row.get(3)?,
                customer_phone_snapshot: row.get(4)?,
                service_id: row.get(5)?,
                description: row.get(6)?,
                dimensions: row.get(7)?,
                quantity: row.get(8)?,
                notes: row.get(9)?,
                assigned_designer: row.get(10)?,
                assigned_printer: row.get(11)?,
                assigned_installer: row.get(12)?,
                total_price: row.get(13)?,
                deposit: row.get(14)?,
                delivery_date: row.get(15)?,
                status: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        })
        .map_err(|err| err.to_string())?;
    collect_rows(rows)
}

fn list_backup_payments(conn: &Connection) -> Result<Vec<BackupPayment>, String> {
    let mut stmt = conn
        .prepare("SELECT id, order_id, amount, paid_at, note, created_at FROM payments ORDER BY paid_at, id")
        .map_err(|err| err.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(BackupPayment {
                id: row.get(0)?,
                order_id: row.get(1)?,
                amount: row.get(2)?,
                paid_at: row.get(3)?,
                note: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|err| err.to_string())?;
    collect_rows(rows)
}

fn validate_backup(backup: &BackupData) -> Result<(), String> {
    if backup.format_version != 1 {
        return Err("Unsupported backup format version".to_string());
    }
    if backup.services.is_empty() {
        return Err("Backup must contain at least one service".to_string());
    }

    let mut customer_ids = HashSet::new();
    let mut service_ids = HashSet::new();
    let mut order_ids = HashSet::new();
    let mut order_totals = HashMap::new();
    let mut payment_totals: HashMap<&str, f64> = HashMap::new();

    for customer in &backup.customers {
        validate_required(&customer.id, "Customer id")?;
        validate_required(&customer.name, "Customer name")?;
        validate_required(&customer.phone, "Customer phone")?;
        if !customer_ids.insert(customer.id.as_str()) {
            return Err("Backup contains duplicate customer ids".to_string());
        }
    }

    for service in &backup.services {
        validate_required(&service.id, "Service id")?;
        validate_required(&service.label, "Service label")?;
        if !service_ids.insert(service.id.as_str()) {
            return Err("Backup contains duplicate service ids".to_string());
        }
    }

    for order in &backup.orders {
        validate_required(&order.id, "Order id")?;
        validate_required(&order.customer_id, "Order customer id")?;
        validate_required(&order.service_id, "Order service id")?;
        if !order_ids.insert(order.id.as_str()) {
            return Err("Backup contains duplicate order ids".to_string());
        }
        if !customer_ids.contains(order.customer_id.as_str()) {
            return Err("Backup contains an order with a missing customer".to_string());
        }
        if !service_ids.contains(order.service_id.as_str()) {
            return Err("Backup contains an order with a missing service".to_string());
        }
        if order.order_number <= 0 {
            return Err("Order number must be greater than zero".to_string());
        }
        if order.quantity <= 0 {
            return Err("Order quantity must be greater than zero".to_string());
        }
        if order.total_price < 0.0 {
            return Err("Order total cannot be negative".to_string());
        }
        if order.deposit < 0.0 || order.deposit > order.total_price {
            return Err("Order deposit is invalid".to_string());
        }
        order_totals.insert(order.id.as_str(), order.total_price);
    }

    for payment in &backup.payments {
        validate_required(&payment.id, "Payment id")?;
        validate_required(&payment.order_id, "Payment order id")?;
        if !order_ids.contains(payment.order_id.as_str()) {
            return Err("Backup contains a payment with a missing order".to_string());
        }
        if payment.amount <= 0.0 {
            return Err("Payment amount must be greater than zero".to_string());
        }
        *payment_totals.entry(payment.order_id.as_str()).or_default() += payment.amount;
    }

    for (order_id, paid_amount) in payment_totals {
        let total = order_totals
            .get(order_id)
            .ok_or_else(|| "Backup contains a payment with a missing order".to_string())?;
        if paid_amount > *total {
            return Err("Backup contains payments greater than an order total".to_string());
        }
    }

    Ok(())
}

fn list_customers(conn: &Connection) -> Result<Vec<CustomerRecord>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, phone, business, address, notes FROM customers ORDER BY name")
        .map_err(|err| err.to_string())?;

    let rows = stmt
        .query_map([], customer_from_row)
        .map_err(|err| err.to_string())?;

    collect_rows(rows)
}

fn get_customer_by_id(conn: &Connection, id: &str) -> Result<Option<CustomerRecord>, String> {
    conn.query_row(
        "SELECT id, name, phone, business, address, notes FROM customers WHERE id = ?1",
        params![id],
        customer_from_row,
    )
    .optional()
    .map_err(|err| err.to_string())
}

fn ensure_customer(conn: &Connection, name: &str, phone: &str) -> Result<CustomerRecord, String> {
    validate_required(name, "Customer name")?;
    validate_required(phone, "Customer phone")?;

    if let Some(customer) = conn
        .query_row(
            "SELECT id, name, phone, business, address, notes
             FROM customers
             WHERE name = ?1 AND phone = ?2",
            params![name.trim(), phone.trim()],
            customer_from_row,
        )
        .optional()
        .map_err(|err| err.to_string())?
    {
        return Ok(customer);
    }

    let id = generate_id();
    conn.execute(
        "INSERT INTO customers (id, name, phone) VALUES (?1, ?2, ?3)",
        params![id, name.trim(), phone.trim()],
    )
    .map_err(|err| err.to_string())?;

    get_customer_by_id(conn, &id)?.ok_or_else(|| "Customer was not saved".to_string())
}

fn customer_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<CustomerRecord> {
    Ok(CustomerRecord {
        id: row.get(0)?,
        name: row.get(1)?,
        phone: row.get(2)?,
        business: row.get(3)?,
        address: row.get(4)?,
        notes: row.get(5)?,
    })
}

fn list_services(conn: &Connection) -> Result<Vec<ServiceRecord>, String> {
    let mut stmt = conn
        .prepare("SELECT id, label FROM services ORDER BY created_at, label")
        .map_err(|err| err.to_string())?;

    let rows = stmt
        .query_map([], service_from_row)
        .map_err(|err| err.to_string())?;

    collect_rows(rows)
}

fn get_service_by_id(conn: &Connection, id: &str) -> Result<Option<ServiceRecord>, String> {
    conn.query_row(
        "SELECT id, label FROM services WHERE id = ?1",
        params![id],
        service_from_row,
    )
    .optional()
    .map_err(|err| err.to_string())
}

fn service_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<ServiceRecord> {
    Ok(ServiceRecord {
        id: row.get(0)?,
        label: row.get(1)?,
    })
}

fn list_orders(conn: &Connection) -> Result<Vec<OrderRecord>, String> {
    let mut stmt = conn
        .prepare(ORDER_SELECT_SQL)
        .map_err(|err| err.to_string())?;
    let order_rows = stmt
        .query_map([], order_from_row)
        .map_err(|err| err.to_string())?;
    let mut orders = collect_rows(order_rows)?;

    for order in &mut orders {
        order.payments = list_payments(conn, &order.id)?;
    }

    Ok(orders)
}

fn get_order_by_id(conn: &Connection, id: &str) -> Result<Option<OrderRecord>, String> {
    let mut order = conn
        .query_row(
            &format!("{ORDER_SELECT_SQL} WHERE orders.id = ?1"),
            params![id],
            order_from_row,
        )
        .optional()
        .map_err(|err| err.to_string())?;

    if let Some(order) = &mut order {
        order.payments = list_payments(conn, &order.id)?;
    }

    Ok(order)
}

fn list_payments(conn: &Connection, order_id: &str) -> Result<Vec<PaymentRecord>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, amount, paid_at, note FROM payments WHERE order_id = ?1 ORDER BY paid_at",
        )
        .map_err(|err| err.to_string())?;
    let rows = stmt
        .query_map(params![order_id], |row| {
            Ok(PaymentRecord {
                id: row.get(0)?,
                amount: row.get(1)?,
                date: row.get(2)?,
                note: row.get(3)?,
            })
        })
        .map_err(|err| err.to_string())?;

    collect_rows(rows)
}

fn order_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<OrderRecord> {
    Ok(OrderRecord {
        id: row.get(0)?,
        order_number: row.get(1)?,
        customer_id: row.get(2)?,
        customer_name: row.get(3)?,
        phone: row.get(4)?,
        service_type: row.get(5)?,
        description: row.get(6)?,
        dimensions: row.get(7)?,
        quantity: row.get(8)?,
        notes: row.get(9)?,
        assigned_designer: row.get(10)?,
        assigned_printer: row.get(11)?,
        assigned_installer: row.get(12)?,
        total_price: row.get(13)?,
        deposit: row.get(14)?,
        payments: Vec::new(),
        paid_amount: row.get(15)?,
        remaining_amount: row.get(16)?,
        payment_status: row.get(17)?,
        delivery_date: row.get(18)?,
        status: row.get(19)?,
        created_at: row.get(20)?,
    })
}

fn validate_order_input(input: &OrderInput) -> Result<(), String> {
    validate_required(&input.customer_name, "Customer name")?;
    validate_required(&input.phone, "Customer phone")?;
    validate_required(&input.service_type, "Service type")?;
    validate_required(&input.status, "Order status")?;

    if input.quantity.unwrap_or(1) <= 0 {
        return Err("Quantity must be greater than zero".to_string());
    }
    if input.total_price < 0.0 {
        return Err("Total price cannot be negative".to_string());
    }

    let deposit = input.deposit.unwrap_or(0.0);
    if deposit < 0.0 {
        return Err("Deposit cannot be negative".to_string());
    }
    if deposit > input.total_price {
        return Err("Deposit cannot exceed total price".to_string());
    }

    Ok(())
}

fn next_order_number(conn: &Connection) -> Result<i64, String> {
    let current: i64 = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'next_order_number'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|err| err.to_string())?
        .unwrap_or_else(|| "1001".to_string())
        .parse()
        .map_err(|_| "Invalid next order number setting".to_string())?;

    conn.execute(
        "INSERT INTO settings (key, value, updated_at)
         VALUES ('next_order_number', ?1, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        params![(current + 1).to_string()],
    )
    .map_err(|err| err.to_string())?;

    Ok(current)
}

fn ensure_next_order_number(conn: &Connection) -> Result<(), String> {
    let max_order_number: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(order_number), 1000) FROM orders",
            [],
            |row| row.get(0),
        )
        .map_err(|err| err.to_string())?;

    let next = max_order_number + 1;
    let existing = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'next_order_number'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|err| err.to_string())?
        .and_then(|value| value.parse::<i64>().ok())
        .unwrap_or(0);

    if existing < next {
        conn.execute(
            "INSERT INTO settings (key, value, updated_at)
             VALUES ('next_order_number', ?1, datetime('now'))
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
            params![next.to_string()],
        )
        .map_err(|err| err.to_string())?;
    }

    Ok(())
}

fn paid_amount_for_order(conn: &Connection, order_id: &str) -> Result<f64, String> {
    conn.query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE order_id = ?1",
        params![order_id],
        |row| row.get(0),
    )
    .map_err(|err| err.to_string())
}

fn current_timestamp() -> String {
    chrono_like_now()
}

fn chrono_like_now() -> String {
    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();
    format!("{seconds}")
}

fn collect_rows<T>(
    rows: rusqlite::MappedRows<'_, impl FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<T>>,
) -> Result<Vec<T>, String> {
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|err| err.to_string())
}

fn clean_optional(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn validate_required(value: &str, label: &str) -> Result<(), String> {
    if value.trim().is_empty() {
        Err(format!("{label} is required"))
    } else {
        Ok(())
    }
}

fn generate_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();
    format!("{:x}{:x}", nanos, std::process::id())
}

const ORDER_SELECT_SQL: &str = r#"
SELECT
    orders.id,
    orders.order_number,
    orders.customer_id,
    orders.customer_name_snapshot,
    orders.customer_phone_snapshot,
    orders.service_id,
    orders.description,
    orders.dimensions,
    orders.quantity,
    orders.notes,
    orders.assigned_designer,
    orders.assigned_printer,
    orders.assigned_installer,
    orders.total_price,
    orders.deposit,
    order_payment_totals.paid_amount,
    order_payment_totals.remaining_amount,
    order_payment_totals.payment_status,
    orders.delivery_date,
    orders.status,
    orders.created_at
FROM orders
JOIN order_payment_totals ON order_payment_totals.order_id = orders.id
"#;

const SCHEMA_V1: &str = r#"
BEGIN;

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    business TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number INTEGER NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    customer_name_snapshot TEXT NOT NULL,
    customer_phone_snapshot TEXT NOT NULL,
    service_id TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    dimensions TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    notes TEXT,
    assigned_designer TEXT,
    assigned_printer TEXT,
    assigned_installer TEXT,
    total_price REAL NOT NULL DEFAULT 0 CHECK (total_price >= 0),
    deposit REAL NOT NULL DEFAULT 0 CHECK (deposit >= 0),
    delivery_date TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new' CHECK (
        status IN (
            'new',
            'designing',
            'design_done',
            'printing',
            'cutting',
            'installing',
            'done',
            'delivered'
        )
    ),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (service_id) REFERENCES services(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    paid_at TEXT NOT NULL DEFAULT (datetime('now')),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

CREATE VIEW IF NOT EXISTS order_payment_totals AS
SELECT
    orders.id AS order_id,
    COALESCE(SUM(payments.amount), 0) AS paid_amount,
    orders.total_price - COALESCE(SUM(payments.amount), 0) AS remaining_amount,
    CASE
        WHEN COALESCE(SUM(payments.amount), 0) <= 0 THEN 'unpaid'
        WHEN COALESCE(SUM(payments.amount), 0) >= orders.total_price THEN 'paid'
        ELSE 'partially_paid'
    END AS payment_status
FROM orders
LEFT JOIN payments ON payments.order_id = orders.id
GROUP BY orders.id;

COMMIT;
"#;

#[cfg(test)]
mod tests {
    use super::*;

    fn migrated_connection() -> Connection {
        let conn = Connection::open_in_memory().expect("open in-memory database");
        migrate(&conn).expect("run migration");
        conn
    }

    #[test]
    fn migration_creates_schema_and_default_services() {
        let conn = migrated_connection();

        let schema_version: i64 = conn
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .expect("read schema version");
        let service_count = count_rows(&conn, "services").expect("count services");
        let order_count = count_rows(&conn, "orders").expect("count orders");

        assert_eq!(schema_version, 1);
        assert_eq!(service_count, 7);
        assert_eq!(order_count, 0);
    }

    #[test]
    fn add_order_creates_customer_payment_and_totals() {
        let mut conn = migrated_connection();
        let tx = conn.transaction().expect("transaction");
        let input = OrderInput {
            customer_name: "Ali".to_string(),
            phone: "0910000000".to_string(),
            service_type: "printing".to_string(),
            description: "Banner".to_string(),
            dimensions: None,
            quantity: Some(1),
            notes: None,
            assigned_designer: None,
            assigned_printer: None,
            assigned_installer: None,
            total_price: 100.0,
            deposit: Some(25.0),
            delivery_date: "".to_string(),
            status: "new".to_string(),
        };
        let customer = ensure_customer(&tx, &input.customer_name, &input.phone).expect("customer");
        let order_id = generate_id();
        let order_number = next_order_number(&tx).expect("order number");
        tx.execute(
            "INSERT INTO orders (
                id, order_number, customer_id, customer_name_snapshot, customer_phone_snapshot,
                service_id, description, quantity, total_price, deposit, delivery_date, status
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                order_id,
                order_number,
                customer.id,
                customer.name,
                customer.phone,
                input.service_type,
                input.description,
                input.quantity.unwrap(),
                input.total_price,
                input.deposit.unwrap(),
                input.delivery_date,
                input.status
            ],
        )
        .expect("insert order");
        tx.execute(
            "INSERT INTO payments (id, order_id, amount, note) VALUES (?1, ?2, ?3, ?4)",
            params![generate_id(), order_id, input.deposit.unwrap(), "عربون"],
        )
        .expect("insert payment");
        tx.commit().expect("commit");

        let order = get_order_by_id(&conn, &order_id)
            .expect("get order")
            .expect("order exists");

        assert_eq!(order.order_number, 1001);
        assert_eq!(order.paid_amount, 25.0);
        assert_eq!(order.remaining_amount, 75.0);
        assert_eq!(order.payment_status, "partially_paid");
        assert_eq!(order.payments.len(), 1);
    }
}
