use enigo::{Enigo, KeyboardControllable, MouseButton, MouseControllable};
use serde_json::Value;

#[tauri::command]
fn remote_input(payload: Value) -> Result<(), String> {
    let action = payload
        .get("action")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let mut enigo = Enigo::new();

    match action {
        "mouse_move" => {
            let x = payload.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let y = payload.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            enigo.mouse_move_to(x, y);
        }

        "mouse_click" => {
            let x = payload.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let y = payload.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let button = payload.get("button").and_then(|v| v.as_str()).unwrap_or("left");

            enigo.mouse_move_to(x, y);

            if button == "right" {
                enigo.mouse_click(MouseButton::Right);
            } else {
                enigo.mouse_click(MouseButton::Left);
            }
        }

        "key_text" => {
            if let Some(text) = payload.get("text").and_then(|v| v.as_str()) {
                enigo.key_sequence(text);
            }
        }

        _ => {}
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![remote_input])
        .run(tauri::generate_context!())
        .expect("error while running ADSEA Desk");
}
