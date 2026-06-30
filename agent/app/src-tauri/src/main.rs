#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use enigo::{Enigo, KeyboardControllable, MouseButton, MouseControllable};
use serde_json::Value;
use std::{thread, time::Duration};



#[tauri::command]
fn remote_input(payload: Value) -> Result<(), String> {
    let action = payload.get("action").and_then(|v| v.as_str()).unwrap_or("");
    let mut enigo = Enigo::new();

    match action {
        "shortcut" => {
            release_modifiers(&mut enigo);
        
            let shortcut = payload.get("shortcut").and_then(|v| v.as_str()).unwrap_or("");
        
            match shortcut {
                "win_r" => {
                    enigo.key_down(enigo::Key::Meta);
                    enigo.key_click(enigo::Key::Layout('r'));
                    enigo.key_up(enigo::Key::Meta);
                }
        
                "win_e" => {
                    enigo.key_down(enigo::Key::Meta);
                    enigo.key_click(enigo::Key::Layout('e'));
                    enigo.key_up(enigo::Key::Meta);
                }
        
                "win_i" => {
                    enigo.key_down(enigo::Key::Meta);
                    enigo.key_click(enigo::Key::Layout('i'));
                    enigo.key_up(enigo::Key::Meta);
                }
        
                "win_x" => {
                    enigo.key_down(enigo::Key::Meta);
                    enigo.key_click(enigo::Key::Layout('x'));
                    enigo.key_up(enigo::Key::Meta);
                }
        
                "control_panel" => {
                    enigo.key_down(enigo::Key::Meta);
                    enigo.key_click(enigo::Key::Layout('r'));
                    enigo.key_up(enigo::Key::Meta);
                    thread::sleep(Duration::from_millis(350));
                    enigo.key_sequence("control");
                    enigo.key_click(enigo::Key::Return);
                }
        
                "powershell" => {
                    enigo.key_down(enigo::Key::Meta);
                    enigo.key_click(enigo::Key::Layout('r'));
                    enigo.key_up(enigo::Key::Meta);
                    thread::sleep(Duration::from_millis(350));
                    enigo.key_sequence("powershell");
                    enigo.key_click(enigo::Key::Return);
                }
        
                "taskmgr" => {
                    enigo.key_down(enigo::Key::Meta);
                    enigo.key_click(enigo::Key::Layout('r'));
                    enigo.key_up(enigo::Key::Meta);
                    thread::sleep(Duration::from_millis(350));
                    enigo.key_sequence("taskmgr");
                    enigo.key_click(enigo::Key::Return);
                }
        
                "alt_tab" => {
                    enigo.key_down(enigo::Key::Alt);
                    enigo.key_click(enigo::Key::Tab);
                    thread::sleep(Duration::from_millis(120));
                    enigo.key_up(enigo::Key::Alt);
                }
        
                _ => {}
            }
        
            release_modifiers(&mut enigo);
        }
        
        
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

        "key_text" => {
            release_modifiers(&mut enigo);
        
            if let Some(text) = payload.get("text").and_then(|v| v.as_str()) {
                enigo.key_sequence(text);
            }
        
            release_modifiers(&mut enigo);
        }

        "key_combo" => {
            release_modifiers(&mut enigo);

            let ctrl = payload.get("ctrl").and_then(|v| v.as_bool()).unwrap_or(false);
            let shift = payload.get("shift").and_then(|v| v.as_bool()).unwrap_or(false);
            let alt = payload.get("alt").and_then(|v| v.as_bool()).unwrap_or(false);
            let meta = payload.get("meta").and_then(|v| v.as_bool()).unwrap_or(false);
            let key = payload.get("key").and_then(|v| v.as_str()).unwrap_or("");

            if ctrl { enigo.key_down(enigo::Key::Control); }
            if shift { enigo.key_down(enigo::Key::Shift); }
            if alt { enigo.key_down(enigo::Key::Alt); }
            if meta { enigo.key_down(enigo::Key::Meta); }

            enigo.key_click(map_key(key));

            if meta { enigo.key_up(enigo::Key::Meta); }
            if alt { enigo.key_up(enigo::Key::Alt); }
            if shift { enigo.key_up(enigo::Key::Shift); }
            if ctrl { enigo.key_up(enigo::Key::Control); }

            release_modifiers(&mut enigo);
        }

        _ => {
            release_modifiers(&mut enigo);
        }
    }

    Ok(())
}

fn release_modifiers(enigo: &mut Enigo) {
    enigo.key_up(enigo::Key::Control);
    enigo.key_up(enigo::Key::Shift);
    enigo.key_up(enigo::Key::Alt);
    enigo.key_up(enigo::Key::Meta);
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
        " " => enigo::Key::Space,
        "F1" => enigo::Key::F1,
        "F2" => enigo::Key::F2,
        "F3" => enigo::Key::F3,
        "F4" => enigo::Key::F4,
        "F5" => enigo::Key::F5,
        "F6" => enigo::Key::F6,
        "F7" => enigo::Key::F7,
        "F8" => enigo::Key::F8,
        "F9" => enigo::Key::F9,
        "F10" => enigo::Key::F10,
        "F11" => enigo::Key::F11,
        "F12" => enigo::Key::F12,
        _ => {
            let ch = key.chars().next().unwrap_or(' ');
            enigo::Key::Layout(ch)
        }
    }
}


#[tauri::command]
fn minimize_app_window(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}


#[tauri::command]
fn show_app_window(window: tauri::Window) -> Result<(), String> {
    window.unminimize().map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}



fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![remote_input, minimize_app_window, show_app_window])
        .run(tauri::generate_context!())
        .expect("error while running ADSEA Desk");
}
