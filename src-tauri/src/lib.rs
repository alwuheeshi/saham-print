mod db;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db = db::init(app.handle())?;
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::database_status,
            db::auth_status,
            db::auth_login,
            db::auth_logout,
            db::auth_get_account,
            db::auth_update_account,
            db::db_list_customers,
            db::db_add_customer,
            db::db_update_customer,
            db::db_delete_customer,
            db::db_list_services,
            db::db_add_service,
            db::db_update_service,
            db::db_delete_service,
            db::db_list_orders,
            db::db_get_order,
            db::db_add_order,
            db::db_update_order,
            db::db_delete_order,
            db::db_add_payment,
            db::db_export_backup,
            db::db_import_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running Saham Print");
}
