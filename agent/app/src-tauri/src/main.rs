#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use enigo::{Enigo, KeyboardControllable, MouseButton, MouseControllable};
use serde_json::Value;



#[tauri::command]
fn remote_input(payload: Value) -> Result<(), String> {
    let action = payload.get("action").and_then(|v| v.as_str()).unwrap_or("");
    let mut enigo = Enigo::new();

    match action {
        "mouse_move" => {
            let x = payload.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let y = payload.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            enigo.mouse_move_to(x, y);
        }

        "mouse_down" => {
            let x = payload.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let y = payload.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let button = mouse_button(payload.get("button").and_then(|v| v.as_str()).unwrap_or("left"));
            enigo.mouse_move_to(x, y);
            enigo.mouse_down(button);
        }

        "mouse_up" => {
            let x = payload.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let y = payload.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let button = mouse_button(payload.get("button").and_then(|v| v.as_str()).unwrap_or("left"));
            enigo.mouse_move_to(x, y);
            enigo.mouse_up(button);
        }

        "mouse_double_click" => {
            let x = payload.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let y = payload.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            enigo.mouse_move_to(x, y);
            enigo.mouse_click(MouseButton::Left);
            enigo.mouse_click(MouseButton::Left);
        }

        "mouse_wheel" => {
            let delta = payload.get("delta_y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            enigo.mouse_scroll_y(delta);
        }

        "key_down" => {
            let key = payload.get("key").and_then(|v| v.as_str()).unwrap_or("");
            enigo.key_down(map_key(key));
        }

        "key_up" => {
            let key = payload.get("key").and_then(|v| v.as_str()).unwrap_or("");
            enigo.key_up(map_key(key));
        }

        _ => {}
    }

    Ok(())
}

fn mouse_button(button: &str) -> MouseButton {
    match button {
        "right" => MouseButton::Right,
        "middle" => MouseButton::Middle,
        _ => MouseButton::Left,
    }
}

fn map_key(key: &str) -> enigo::Key {
    match key {
        "Enter" => enigo::Key::Return,
        "Backspace" => enigo::Key::Backspace,
        "Tab" => enigo::Key::Tab,
        "Escape" => enigo::Key::Escape,
        "Delete" => enigo::Key::Delete,
        "ArrowUp" => enigo::Key::UpArrow,
        "ArrowDown" => enigo::Key::DownArrow,
        "ArrowLeft" => enigo::Key::LeftArrow,
        "ArrowRight" => enigo::Key::RightArrow,
        "Home" => enigo::Key::Home,
        "End" => enigo::Key::End,
        "PageUp" => enigo::Key::PageUp,
        "PageDown" => enigo::Key::PageDown,
        "Shift" => enigo::Key::Shift,
        "Control" => enigo::Key::Control,
        "Alt" => enigo::Key::Alt,
        "Meta" => enigo::Key::Meta,
        " " => enigo::Key::Space,
        _ => {
            let ch = key.chars().next().unwrap_or(' ');
            enigo::Key::Layout(ch)
        }
    }
}



fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![remote_input])
        .run(tauri::generate_context!())
        .expect("error while running ADSEA Desk");
}
