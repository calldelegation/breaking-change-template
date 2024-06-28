# Sepolia Testnet Breaking Change Guide

## June 28, 2024

Release [v1.0.4](https://github.com/calldelegation/breaking-change-template/releases/tag/v1.0.4)

```Rust
/* BEFORE */
let bad = "dog"

/* AFTER */
let bad = "doggy"
```



## Release [v1.0.3](https://github.com/calldelegation/breaking-change-template/releases/tag/v1.0.3)

```Rust
/* BEFORE */
let hello = "world"

/* AFTER */
let hello = "world i am here"
```

## Release [v1.0.2](https://github.com/calldelegation/breaking-change-template/releases/tag/v1.0.2)

Testing some changes

```rust
/* BEFORE */
let function_selector = fn_selector!(my_contract_function(MyArgType));
 
/* AFTER */
let function_selector = encode_fn_selector("my_contract_function");
```

## Release [v1.0.1](https://github.com/calldelegation/breaking-change-template/releases/tag/v1.0.1)

The `std::call_frames::second_param` function now returns a `u64` instead of a generic type `T`.

`contract_id()` has been removed in favor of `ContractId::this()`.

```rust
/* BEFORE */
let contract_id = contract_id();

/* AFTER */
let contract_id = ContractId::this();
```

`call_with_function_selector_vec` has been removed in favor of `call_with_function_selector`.

```rust
/* BEFORE */
pub fn call_with_function_selector_vec(
  target: ContractId,
  function_selector: Vec<u8>,
  calldata: Vec<u8>,
  single_value_type_arg: bool,
  call_params: CallParams
) {...}

/* AFTER */
pub fn call_with_function_selector_vec(
  target: ContractId,
  function_selector: Bytes // new
  calldata: Bytes, // new
  call_params: CallParams
) {...}
```

The `BASE_ASSET_ID` constant has been removed, and `AssetId::base_asset_id()` is now `AssetId::base()`.

```rust
/* BEFORE */
let base_asset_id = BASE_ASSET_ID;
/* OR */
let base_asset_id = AssetId::base_asset_id();

/* AFTER */
let base_asset_id = AssetId:base();
```
