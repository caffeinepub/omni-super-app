import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  var balances = Map.empty<Principal, Nat>();
  var transactions = Map.empty<Nat, Transaction>();
  var nextTransactionId = 0;
  var id777ByPrincipal = Map.empty<Principal, Text>();
  var principalById777 = Map.empty<Text, Principal>();
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
      Runtime.trap("Unauthorized");
    };
    switch (balances.get(caller)) {
      case (null) {
        balances.add(caller, tokenAmount);
        tokenAmount;
      };
      case (?val) { val };
    };
  };

  public query ({ caller }) func getBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (balances.get(caller)) {
      case (null) { 0 };
      case (?val) { val };
    };
  };

  public shared ({ caller }) func transferTokens(to : Principal, amount : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (amount == 0) { Runtime.trap("Amount must be > 0") };
    if (to == caller) { Runtime.trap("Cannot transfer to self") };
    switch (balances.get(caller)) {
      case (null) { Runtime.trap("No balance") };
      case (?balance) {
        if (balance < amount) { Runtime.trap("Insufficient balance") };
        let newBalance : Nat = Nat.sub(balance, amount);
        let id = getNextTransactionId();
        transactions.add(id, { id; from = caller; to; amount; timestamp = Time.now() });
        balances.add(caller, newBalance);
        let recv = switch (balances.get(to)) { case (null) { amount }; case (?b) { b + amount } };
        balances.add(to, recv);
        newBalance;
      };
    };
  };

  public shared ({ caller }) func registerId777(id777 : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    // Remove old mapping if exists
    switch (id777ByPrincipal.get(caller)) {
      case (?oldId) { ignore principalById777.remove(oldId) };
      case (null) {};
    };
    id777ByPrincipal.add(caller, id777);
    principalById777.add(id777, caller);
  };

  public query ({ caller }) func getRegisteredId777() : async ?Text {
    id777ByPrincipal.get(caller);
  };

  public query func lookupPrincipalById777(id777 : Text) : async ?Principal {
    principalById777.get(id777);
  };

  public query func lookupId777ByPrincipal(p : Principal) : async ?Text {
    id777ByPrincipal.get(p);
  };

  public shared ({ caller }) func transferById777(toId777 : Text, amount : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (principalById777.get(toId777)) {
      case (null) { Runtime.trap("Recipient +777 ID not found") };
      case (?toPrincipal) {
        if (amount == 0) { Runtime.trap("Amount must be > 0") };
        if (toPrincipal == caller) { Runtime.trap("Cannot transfer to self") };
        switch (balances.get(caller)) {
          case (null) { Runtime.trap("No balance") };
          case (?balance) {
            if (balance < amount) { Runtime.trap("Insufficient balance") };
            let newBalance : Nat = Nat.sub(balance, amount);
            let id = getNextTransactionId();
            transactions.add(id, { id; from = caller; to = toPrincipal; amount; timestamp = Time.now() });
            balances.add(caller, newBalance);
            let recv = switch (balances.get(toPrincipal)) { case (null) { amount }; case (?b) { b + amount } };
            balances.add(toPrincipal, recv);
            newBalance;
          };
        };
      };
    };
  };

  public query ({ caller }) func getMyTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    transactions.values().filter(
      func(t) { t.from == caller or t.to == caller }
    ).toArray();
  };

  func getNextTransactionId() : Nat {
    nextTransactionId += 1;
    nextTransactionId;
  };
};
