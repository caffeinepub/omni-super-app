import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Nat64 "mo:core/Nat64";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  stable var balances = Map.empty<Principal, Nat>();
  stable var transactions = Map.empty<Nat, Transaction>();
  stable var nextTransactionId = 0;
  let tokenAmount = 250;

  type Transaction = {
    id : Nat;
    from : Principal;
    to : Principal;
    amount : Nat;
    timestamp : Int;
  };

  public shared ({ caller }) func mintInitialTokens() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mint tokens");
    };

    switch (balances.get(caller)) {
      case (null) {
        let balance = tokenAmount;
        balances.add(caller, balance);
        balance;
      };
      case (?val) { val };
    };
  };

  public query ({ caller }) func getBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check balance");
    };

    switch (balances.get(caller)) {
      case (null) { 0 };
      case (?val) { val };
    };
  };

  public shared ({ caller }) func transferTokens(to : Principal, amount : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can transfer tokens");
    };

    if (amount <= 0) {
      Runtime.trap("Amount must be greater than zero");
    };

    if (to == caller) {
      Runtime.trap("Cannot transfer to self");
    };

    switch (balances.get(caller)) {
      case (null) {
        Runtime.trap("No balance found for caller");
      };
      case (?balance) {
        if (balance < amount) {
          Runtime.trap("Insufficient balance");
        };

        let id = getNextTransactionId();

        let transaction : Transaction = {
          id;
          from = caller;
          to;
          amount;
          timestamp = Time.now();
        };

        transactions.add(id, transaction);

        let newBalance = balance - amount;
        balances.add(caller, newBalance);

        let receiverBalance = switch (balances.get(to)) {
          case (null) { amount };
          case (?balance) { balance + amount };
        };

        balances.add(to, receiverBalance);

        newBalance;
      };
    };
  };

  public query ({ caller }) func getMyTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    let myTransactions = transactions.values().filter(
      func(transaction) {
        transaction.from == caller or transaction.to == caller;
      }
    );
    myTransactions.toArray();
  };

  func getNextTransactionId() : Nat {
    nextTransactionId += 1;
    nextTransactionId;
  };
};
