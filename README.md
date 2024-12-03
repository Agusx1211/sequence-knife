# Sequence-Knife

Sequence-Knife is a command-line interface tool designed to help debug and analyze Sequence Smart Wallet configurations and signatures.

## Features

- Decode and analyze Sequence Smart Wallet configurations
- Find subdigest combinations for signature verification
- Command-line interface for easy integration into scripts and workflows
- Lightweight and fast, built with Bun

```
sequence-knife <command>

Commands:
  sequence-knife initialImageHash <walletA  Obtain the initial image hash of a w
  ddress>                                   allet
  sequence-knife deployCalldata <walletAdd  Code to deploy a wallet
  ress>
  sequence-knife decode <signature>         Decode a signature
  sequence-knife subdigestFinder            Find combinations of parameters that
                                             match a known subdigest
  sequence-knife subdigest                  Calculate a subdigest for given chai
                                            nId, address and digest
  sequence-knife config <imageHash>         Get configuration for a given imageH
                                            ash
```

## Prerequisites

- [Bun](https://bun.sh) installed on your system

## Installation

To install Sequence-Knife, clone the repository and install dependencies:

```bash
git clone https://github.com/agusx1211/sequence-knife.git
cd sequence-knife
bun install && bun link
```

Or just run it using:

```bash
bun start
```

## Usage

Run Sequence-Knife from the terminal with the following command:

```bash
sequence-knife [options] <input-file>
```

### Options

- `-h, --help`: Display help information.
- `-v, --version`: Show the version of Sequence-Knife.
- `-o, --output <file>`: Specify the output file.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

For more information, please refer to the documentation or contact the project maintainers.
