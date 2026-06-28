#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
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

        "key_special" => {
            if let Some(key) = payload.get("key").and_then(|v| v.as_str()) {
                match key {
                    "Enter" => enigo.key_click(enigo::Key::Return),
                    "Backspace" => enigo.key_click(enigo::Key::Backspace),
                    "Tab" => enigo.key_click(enigo::Key::Tab),
                    "Escape" => enigo.key_click(enigo::Key::Escape),
                    "Delete" => enigo.key_click(enigo::Key::Delete),
                    "ArrowUp" => enigo.key_click(enigo::Key::UpArrow),
                    "ArrowDown" => enigo.key_click(enigo::Key::DownArrow),
                    "ArrowLeft" => enigo.key_click(enigo::Key::LeftArrow),
                    "ArrowRight" => enigo.key_click(enigo::Key::RightArrow),
                    "Home" => enigo.key_click(enigo::Key::Home),
                    "End" => enigo.key_click(enigo::Key::End),
                    "PageUp" => enigo.key_click(enigo::Key::PageUp),
                    "PageDown" => enigo.key_click(enigo::Key::PageDown),
                    _ => {}
                }
            }
        }

        "key_combo" => {
            let ctrl = payload.get("ctrl").and_then(|v| v.as_bool()).unwrap_or(false);
            let key = payload.get("key").and_then(|v| v.as_str()).unwrap_or("");

            if ctrl {
                enigo.key_down(enigo::Key::Control);
                match key {
                    "a" => enigo.key_click(enigo::Key::Layout('a')),
                    "c" => enigo.key_click(enigo::Key::Layout('c')),
                    "v" => enigo.key_click(enigo::Key::Layout('v')),
                    "x" => enigo.key_click(enigo::Key::Layout('x')),
                    "z" => enigo.key_click(enigo::Key::Layout('z')),
                    _ => {}
                }
                enigo.key_up(enigo::Key::Control);
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
