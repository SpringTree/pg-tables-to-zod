import { createInterface } from "node:readline";

// Asks for a password on the terminal without echoing it.
// - On a terminal (TTY) stdin is switched to raw mode and read key by key:
//   enter finishes, backspace removes the last character and ctrl+c aborts
// - Without a terminal (piped input) the first line is read as is
//
export async function promptPassword(message: string): Promise<string> {
  const { stdin, stdout } = process;
  stdout.write(message);

  if (!stdin.isTTY) {
    const lineReader = createInterface({ input: stdin });
    for await (const line of lineReader) {
      lineReader.close();
      return line;
    }
    return "";
  }

  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();

  return new Promise((resolve) => {
    let password = "";

    const finish = () => {
      stdin.off("data", onKeys);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };

    // A chunk holds several characters when text is pasted
    //
    const onKeys = (keys: string) => {
      for (const key of keys) {
        if (key === "\r" || key === "\n") {
          finish();
          resolve(password);
          return;
        }
        if (key === "\u0003") {
          // ctrl+c, exit like a terminal interrupt would
          finish();
          process.exit(130);
        }
        if (key === "\u007f" || key === "\b") {
          // backspace or delete
          password = password.slice(0, -1);
          continue;
        }
        password += key;
      }
    };

    stdin.on("data", onKeys);
  });
}

//
